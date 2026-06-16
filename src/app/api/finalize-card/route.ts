import { NextResponse } from "next/server";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { config } from "@/lib/config";
import { uploadToWalrus, walrusBlobUrl } from "@/lib/walrus";

export const maxDuration = 60;

// Hugging Face Inference (the old api-inference.huggingface.co host is
// deprecated; the new router has FLUX-schnell with a free tier).
const HF_MODEL = "black-forest-labs/FLUX.1-schnell";
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

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

    const hfToken = process.env.HUGGINGFACE_API_KEY?.trim();
    if (!hfToken) {
      unrecordDigest(paymentDigest);
      return NextResponse.json(
        {
          error:
            "Image generation is not configured. Server is missing HUGGINGFACE_API_KEY.",
        },
        { status: 500 }
      );
    }

    const imageRes = await fetch(HF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
        Accept: "image/jpeg",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width: 1024,
          height: 1024,
          num_inference_steps: 4,
          guidance_scale: 0,
        },
      }),
      signal: AbortSignal.timeout(55_000),
    });

    if (!imageRes.ok) {
      unrecordDigest(paymentDigest);
      const bodyText = await imageRes.text().catch(() => "");
      const hint =
        imageRes.status === 401
          ? " (HUGGINGFACE_API_KEY may be invalid)"
          : imageRes.status === 402 || imageRes.status === 429
          ? " (rate limit or free-tier quota hit; try again in a few minutes)"
          : imageRes.status === 503
          ? " (model is loading on Hugging Face — retry in 20s)"
          : "";
      console.error("HF inference failed:", imageRes.status, bodyText.slice(0, 200));
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
