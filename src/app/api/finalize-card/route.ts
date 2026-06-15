import { NextResponse } from "next/server";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { config } from "@/lib/config";
import { uploadToWalrus, walrusBlobUrl } from "@/lib/walrus";

export const maxDuration = 60;

const POLLINATIONS_URL = "https://image.pollinations.ai/prompt";

const sui = new SuiJsonRpcClient({
  url: config.sui.rpcUrl,
  network: config.sui.network,
});

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

function buildCompositePrompt(planTitle: string, wishes: string[]): string {
  const cleaned = wishes
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((w) => (w.length > 100 ? w.slice(0, 100) + "…" : w));

  const wishesLine =
    cleaned.length > 0
      ? `Inspired by friends' wishes: ${cleaned.join(" · ")}.`
      : "";

  return (
    `Vibrant collaborative birthday card collage celebrating "${planTitle}". ` +
    wishesLine +
    ` Birthday cake with lit candles, balloons, confetti, streamers, ` +
    `warm festive colors, joyful party atmosphere, painterly composition, ` +
    `high quality digital art.`
  );
}

export async function POST(req: Request) {
  let paymentDigest: string | undefined;
  try {
    const body = (await req.json()) as {
      planTitle?: string;
      wishes?: string[];
      paymentDigest?: string;
    };

    const planTitle = (body.planTitle ?? "").trim();
    const wishes = Array.isArray(body.wishes) ? body.wishes : [];
    paymentDigest = body.paymentDigest;

    if (!planTitle) {
      return NextResponse.json(
        { error: "Plan title is required." },
        { status: 400 }
      );
    }
    if (!paymentDigest || typeof paymentDigest !== "string") {
      return NextResponse.json(
        { error: "Payment receipt required to finalize the card." },
        { status: 402 }
      );
    }

    const v = await verifyPayment(paymentDigest);
    if (!v.ok) {
      return NextResponse.json({ error: v.reason }, { status: 402 });
    }

    recordDigest(paymentDigest);

    const prompt = buildCompositePrompt(planTitle, wishes);
    const seed = Math.floor(Math.random() * 1_000_000_000);
    const url =
      `${POLLINATIONS_URL}/${encodeURIComponent(prompt)}` +
      `?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`;

    // Pollinations now requires a token for cloud/shared-IP traffic.
    // Token is server-only — never expose to the client bundle.
    const pollinationsToken = process.env.POLLINATIONS_TOKEN?.trim();
    const headers: Record<string, string> = {};
    if (pollinationsToken) {
      headers["Authorization"] = `Bearer ${pollinationsToken}`;
    }

    const imageRes = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(55_000),
    });
    if (!imageRes.ok) {
      unrecordDigest(paymentDigest);
      const hint =
        imageRes.status === 402 && !pollinationsToken
          ? " (server is missing POLLINATIONS_TOKEN — get one at https://enter.pollinations.ai)"
          : imageRes.status === 402
          ? " (the configured POLLINATIONS_TOKEN may be invalid or out of credit)"
          : "";
      return NextResponse.json(
        { error: `Image generation failed (HTTP ${imageRes.status})${hint}.` },
        { status: 502 }
      );
    }

    const imageBlob = await imageRes.blob();
    const blobId = await uploadToWalrus(imageBlob);

    return NextResponse.json({
      blobId,
      imageUrl: walrusBlobUrl(blobId),
    });
  } catch (error: any) {
    if (paymentDigest) unrecordDigest(paymentDigest);
    console.error("finalize-card error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to finalize card" },
      { status: 500 }
    );
  }
}
