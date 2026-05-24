import { NextResponse } from "next/server";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { config } from "@/lib/config";

export const maxDuration = 60;

const POLLINATIONS_URL = "https://image.pollinations.ai/prompt";

const sui = new SuiJsonRpcClient({
  url: config.sui.rpcUrl,
  network: config.sui.network,
});

// In-memory replay protection — fine for a single Cloud Run instance,
// swap for a shared store (Redis, KV) if the deployment ever scales horizontally.
const usedDigests = new Set<string>();
function recordDigest(d: string) {
  usedDigests.add(d);
  if (usedDigests.size > 5_000) usedDigests.clear();
}
function unrecordDigest(d: string) {
  usedDigests.delete(d);
}

async function verifyPayment(
  digest: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (usedDigests.has(digest)) {
    return { ok: false, reason: "This payment receipt was already used." };
  }

  let tx;
  try {
    tx = await sui.getTransactionBlock({
      digest,
      options: { showEffects: true, showBalanceChanges: true },
    });
  } catch {
    return {
      ok: false,
      reason:
        "Couldn't find that transaction on Sui yet — try again in a few seconds.",
    };
  }

  if (tx.effects?.status?.status !== "success") {
    return { ok: false, reason: "Payment transaction did not succeed on-chain." };
  }

  const treasury = config.sui.treasuryAddress;
  const fee = config.sui.feeMist;

  const credit = (tx.balanceChanges ?? []).find((bc) => {
    if (typeof bc.owner !== "object" || bc.owner === null) return false;
    const owner = bc.owner as { AddressOwner?: string };
    if (!owner.AddressOwner) return false;
    if (owner.AddressOwner.toLowerCase() !== treasury) return false;
    let amount: bigint;
    try {
      amount = BigInt(bc.amount);
    } catch {
      return false;
    }
    return amount >= fee;
  });

  if (!credit) {
    return {
      ok: false,
      reason: `Couldn't find a payment of ≥ ${fee} MIST to the treasury in that transaction.`,
    };
  }

  return { ok: true };
}

export async function POST(req: Request) {
  try {
    const { prompt, paymentDigest } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (!paymentDigest || typeof paymentDigest !== "string") {
      return NextResponse.json(
        { error: "Payment receipt required to unlock generation." },
        { status: 402 }
      );
    }

    const v = await verifyPayment(paymentDigest);
    if (!v.ok) {
      return NextResponse.json({ error: v.reason }, { status: 402 });
    }

    // Mark used BEFORE generation so concurrent requests can't both pass.
    recordDigest(paymentDigest);

    const fullPrompt =
      `Vibrant birthday celebration collage illustration: ${prompt}. ` +
      `Colorful balloons, confetti, birthday cake with lit candles, streamers, ` +
      `joyful party atmosphere, warm festive colors, high quality digital art.`;

    const seed = Math.floor(Math.random() * 1_000_000_000);
    const encodedPrompt = encodeURIComponent(fullPrompt);

    const imageRes = await fetch(
      `${POLLINATIONS_URL}/${encodedPrompt}?model=flux-schnell&width=1024&height=1024&nologo=true&seed=${seed}`,
      { signal: AbortSignal.timeout(55_000) }
    );

    if (!imageRes.ok) {
      // Restore receipt so the user can retry without paying again.
      unrecordDigest(paymentDigest);
      throw new Error(`Pollinations API error: HTTP ${imageRes.status}`);
    }

    const imageBuffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString("base64");
    return NextResponse.json({ imageUrl: `data:image/jpeg;base64,${base64}` });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to generate image" },
      { status: 500 }
    );
  }
}
