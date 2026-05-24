"use client";

import { useMemo, useState } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { uploadToWalrus, fetchImageAsBlob, walrusBlobUrl } from "@/lib/walrus";
import { config } from "@/lib/config";
import {
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ImagePlus,
  ShieldCheck,
  Wallet,
  Wand2,
  Users,
  Loader2,
} from "lucide-react";

const FEE_SUI = Number(config.sui.feeMist) / 1_000_000_000;

interface IdeaFields {
  contributor: string;
  text: string;
  blob_id: string;
}

interface PlanFields {
  title: string;
  creator: string;
  ideas: Array<{ fields: IdeaFields }>;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// Deterministic gradient per address for contributor avatars
function avatarGradient(addr: string) {
  const palette = [
    "from-ember to-rosegold",
    "from-rosegold to-iris",
    "from-iris to-sungold",
    "from-sungold to-ember",
    "from-iris to-ember",
    "from-rosegold to-sungold",
  ];
  let hash = 0;
  for (let i = 2; i < Math.min(addr.length, 14); i++) {
    hash = (hash * 31 + addr.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

export default function PlanView({ planId }: { planId: string }) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: { showEffects: true },
      }),
  });

  const [idea, setIdea] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [paymentDigest, setPaymentDigest] = useState<string>(""); // current receipt
  const [isWorking, setIsWorking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<"info" | "error" | "success">(
    "info"
  );
  const [copied, setCopied] = useState(false);

  // Live polling so friends' wishes appear automatically
  const {
    data: planData,
    isLoading,
    refetch,
    isFetching,
  } = useSuiClientQuery(
    "getObject",
    { id: planId, options: { showContent: true } },
    { refetchInterval: 12_000 }
  );

  const content = planData?.data?.content;
  const planFields =
    content?.dataType === "moveObject"
      ? (content.fields as unknown as PlanFields)
      : null;

  // Derived: unique contributors (including creator)
  const contributors = useMemo(() => {
    if (!planFields) return [];
    const set = new Set<string>();
    set.add(planFields.creator);
    for (const it of planFields.ideas) set.add(it.fields.contributor);
    return Array.from(set);
  }, [planFields]);

  const setMsg = (
    msg: string,
    kind: "info" | "error" | "success" = "info"
  ) => {
    setStatus(msg);
    setStatusKind(kind);
  };

  // Promise wrapper around the callback-based signAndExecute
  const signTx = (tx: Transaction): Promise<{ digest: string }> =>
    new Promise((resolve, reject) => {
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (res: any) => resolve(res),
          onError: (err: any) => reject(err),
        }
      );
    });

  // ── Step 1+2: pay protocol fee on Sui, then ask the server to verify+generate
  const handlePayAndGenerate = async () => {
    if (!idea.trim() || !account) return;
    if (isWorking) return;

    setIsWorking(true);
    setGeneratedImageUrl(null);
    setPaymentDigest("");
    setMsg(`Open your wallet to confirm ${FEE_SUI} SUI…`);

    let digest = "";
    try {
      // 1) Sign the payment transaction
      const payTx = new Transaction();
      const [coin] = payTx.splitCoins(payTx.gas, [
        payTx.pure.u64(config.sui.feeMist),
      ]);
      payTx.transferObjects([coin], config.sui.treasuryAddress);

      const result = await signTx(payTx);
      digest = result.digest;
      setPaymentDigest(digest);
      setMsg("Payment received. Generating your collage…");
    } catch (err: any) {
      setMsg(
        err?.message?.includes("Reject")
          ? "Wallet signature cancelled — no charge."
          : "Payment failed: " + (err?.message ?? err),
        "error"
      );
      setIsWorking(false);
      return;
    }

    // 2) Ask the server to verify the digest and run Pollinations
    try {
      const res = await fetch("/api/generate-collage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: idea, paymentDigest: digest }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setGeneratedImageUrl(data.imageUrl);
      setMsg("Collage ready — review it below, then pin it to the card.", "success");
    } catch (err: any) {
      setMsg(
        "Generation failed: " +
          (err?.message ?? err) +
          " — your payment receipt is still valid; you can retry.",
        "error"
      );
    } finally {
      setIsWorking(false);
    }
  };

  // Allow regeneration with the same receipt (server clears used-digest on failure,
  // and we let the user re-try if they don't like the result)
  const handleRegenerate = async () => {
    if (!paymentDigest || !idea.trim()) return;
    setIsWorking(true);
    setGeneratedImageUrl(null);
    setMsg("Regenerating with your existing receipt…");
    try {
      const res = await fetch("/api/generate-collage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: idea, paymentDigest }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setGeneratedImageUrl(data.imageUrl);
      setMsg("New collage ready.", "success");
    } catch (err: any) {
      setMsg(
        "Regeneration failed: " +
          (err?.message ?? err) +
          " — receipt may be consumed; pay again to try.",
        "error"
      );
    } finally {
      setIsWorking(false);
    }
  };

  // ── Step 3: store on Walrus + add_idea on Sui (no fee bundled now)
  const handlePinToCard = async () => {
    if (!account || !generatedImageUrl) return;
    setIsSaving(true);
    setMsg("Uploading collage to Walrus…");

    try {
      const blob = await fetchImageAsBlob(generatedImageUrl);
      const blobId = await uploadToWalrus(blob);
      setMsg("Stored on Walrus. Sign to pin onto the card…");

      const tx = new Transaction();
      tx.moveCall({
        target: config.sui.moveTargets.addIdea,
        arguments: [
          tx.object(planId),
          tx.pure.string(idea),
          tx.pure.string(blobId),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            setMsg("Pinned on Sui forever. 🎉", "success");
            setIdea("");
            setGeneratedImageUrl(null);
            setPaymentDigest("");
            setTimeout(() => refetch(), 2500);
          },
          onError: (err: any) => {
            setMsg("Pinning failed: " + err.message, "error");
          },
        }
      );
    } catch (err: any) {
      setMsg("Error: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const shareLink =
    typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-celebration animate-pulse" />
          <p className="text-ink-300 text-sm font-mono">Reading plan from Sui…</p>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!planFields) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 pt-24 pb-12 text-center">
        <div className="w-12 h-12 rounded-full bg-rosegold/20 flex items-center justify-center mb-2">
          <span className="text-2xl">?</span>
        </div>
        <h2 className="font-display text-2xl text-ink-50">Plan not found</h2>
        <p className="text-ink-300 text-sm max-w-sm font-mono break-all">
          {planId}
        </p>
        <p className="text-ink-400 text-xs max-w-sm">
          Make sure the contract is deployed on testnet and the plan was created there.
        </p>
      </div>
    );
  }

  const ideaCount = planFields.ideas.length;

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-24">
      {/* ── Plan header ── */}
      <header className="max-w-4xl mx-auto px-5 sm:px-6 mb-10 sm:mb-14">
        <div className="flex items-center gap-2 mb-3 text-[0.7rem] uppercase tracking-[0.2em]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ember" />
          </span>
          <span className="text-ink-300 font-medium">Live · Sui Testnet</span>
          {isFetching && (
            <span className="flex items-center gap-1 text-ink-400 normal-case tracking-normal">
              <Loader2 className="w-3 h-3 animate-spin" />
              syncing
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="min-w-0">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium text-ink-50 leading-[1.05]">
              {planFields.title.replace(/^Birthday Surprise for /i, "")}{" "}
              <span className="italic text-gradient">birthday</span>
            </h1>
            <p className="text-ink-400 text-xs mt-3 font-mono">
              Started by {shortenAddress(planFields.creator)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-ink-100 text-xs font-medium transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-celebration text-white text-xs font-semibold shadow-glow-rose transition-all hover:-translate-y-0.5"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied" : "Copy invite link"}
            </button>
          </div>
        </div>

        {/* Contributor strip + counts */}
        <div className="mt-7 flex items-center gap-4 flex-wrap">
          <div className="flex items-center -space-x-2">
            {contributors.slice(0, 6).map((addr, i) => (
              <span
                key={addr}
                title={shortenAddress(addr)}
                className={`w-8 h-8 rounded-full border-2 border-ink-950 bg-gradient-to-br ${avatarGradient(
                  addr
                )} flex items-center justify-center text-[0.65rem] font-mono text-white shadow-soft-card`}
                style={{ zIndex: 10 - i }}
              >
                {addr.slice(2, 4)}
              </span>
            ))}
            {contributors.length > 6 && (
              <span className="w-8 h-8 rounded-full border-2 border-ink-950 bg-ink-700 flex items-center justify-center text-[0.65rem] text-ink-100">
                +{contributors.length - 6}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-300">
            <Users className="w-3.5 h-3.5" />
            <span>
              <span className="text-ink-50 font-medium">
                {contributors.length}
              </span>{" "}
              {contributors.length === 1 ? "friend" : "friends"} ·{" "}
              <span className="text-ink-50 font-medium">{ideaCount}</span>{" "}
              {ideaCount === 1 ? "wish" : "wishes"} pinned
            </span>
          </div>
        </div>

        <div className="divider-hairline mt-8" />
      </header>

      {/* ── Ideas grid ── */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 mb-16">
        <div className="flex items-baseline justify-between mb-6">
          <p className="eyebrow">The card so far</p>
          <a
            href={`${config.sui.explorerUrl}/object/${planId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[0.7rem] font-mono text-ink-400 hover:text-ink-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View on Suiscan
          </a>
        </div>

        {ideaCount === 0 ? (
          <div className="rounded-3xl glass-card p-10 text-center">
            <Sparkles className="w-6 h-6 text-ember mx-auto mb-3" />
            <p className="font-display text-2xl text-ink-50 mb-1">
              Nothing here yet.
            </p>
            <p className="text-ink-400 text-sm max-w-sm mx-auto">
              Share the invite link with friends — the first wish kicks off the card.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {planFields.ideas.map((item, i) => (
              <article
                key={i}
                className="group relative rounded-2xl overflow-hidden glass-card"
              >
                <div className="relative aspect-square overflow-hidden bg-ink-800">
                  <img
                    src={walrusBlobUrl(item.fields.blob_id)}
                    alt={item.fields.text}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-transparent" />
                  <span
                    className={`absolute top-3 left-3 w-7 h-7 rounded-full border-2 border-ink-950 bg-gradient-to-br ${avatarGradient(
                      item.fields.contributor
                    )} flex items-center justify-center text-[0.6rem] font-mono text-white`}
                  >
                    {item.fields.contributor.slice(2, 4)}
                  </span>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-ink-100 text-sm leading-relaxed mb-3">
                    “{item.fields.text}”
                  </p>
                  <div className="flex items-center justify-between gap-2 text-[0.7rem]">
                    <span className="font-mono text-ink-400">
                      {shortenAddress(item.fields.contributor)}
                    </span>
                    <span className="flex items-center gap-1 text-ink-400">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      On-chain
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Add your wish ── */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6">
        <div className="relative rounded-3xl glass-card overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-celebration" />

          <div className="p-6 sm:p-10">
            <div className="flex items-center gap-2 mb-2">
              <ImagePlus className="w-4 h-4 text-ember" />
              <span className="eyebrow">Your contribution</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-50 mb-2 leading-tight">
              Add your <span className="italic text-gradient">wish</span>
            </h2>
            <p className="text-ink-300 text-sm mb-7 max-w-xl leading-relaxed">
              Two signatures, one shared card. Pay <span className="text-ink-50 font-medium">{FEE_SUI} SUI</span> to unlock AI generation, review your collage, then pin it onto the chain for free.
            </p>

            {/* Step indicator */}
            <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3 text-[0.62rem] sm:text-[0.65rem] uppercase tracking-widest">
              <Step
                num={1}
                shortLabel="Write"
                label="Write idea"
                active={!idea.trim() && !generatedImageUrl}
                done={!!idea.trim() || !!generatedImageUrl}
              />
              <Step
                num={2}
                shortLabel="Pay & gen"
                label="Pay & generate"
                active={!!idea.trim() && !generatedImageUrl}
                done={!!generatedImageUrl}
              />
              <Step
                num={3}
                shortLabel="Pin"
                label="Pin on-chain"
                active={!!generatedImageUrl}
                done={false}
              />
            </div>

            <div className="mb-5">
              <ConnectButton />
            </div>

            <div className="space-y-4">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="E.g., A retro disco theme with a neon cake and glitter raining from the ceiling…"
                disabled={!account || isWorking || isSaving}
                className="input-dark h-32 resize-none disabled:opacity-40"
              />

              {/* Step 2: Pay & generate */}
              {!generatedImageUrl && (
                <>
                  <button
                    onClick={handlePayAndGenerate}
                    disabled={isWorking || !idea.trim() || !account}
                    className="btn-primary w-full"
                  >
                    {!account ? (
                      <>
                        <Wallet className="w-4 h-4" />
                        Connect wallet to begin
                      </>
                    ) : isWorking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Working…
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Pay {FEE_SUI} SUI & generate collage
                      </>
                    )}
                  </button>

                  {/* Preview of what's next so users see the full flow before paying */}
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-4 flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-ink-400 text-xs font-mono">
                      3
                    </span>
                    <div className="min-w-0">
                      <p className="text-ink-100 text-sm font-medium leading-tight mb-0.5">
                        Next: pin your collage to the card
                      </p>
                      <p className="text-ink-400 text-xs leading-snug">
                        After generation, the <span className="text-ink-200">Pin to the card</span> button appears here — one final free signature stores your wish on-chain.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: review + pin */}
              {generatedImageUrl && (
                <div className="space-y-3 pt-2">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10">
                    <img
                      src={generatedImageUrl}
                      alt="AI generated birthday collage"
                      className="w-full"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleRegenerate}
                      disabled={isWorking || isSaving}
                      className="btn-secondary sm:flex-1"
                      title="Use the same payment receipt to spin a new image"
                    >
                      {isWorking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Regenerating…
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Regenerate
                        </>
                      )}
                    </button>
                    <button
                      onClick={handlePinToCard}
                      disabled={isSaving || isWorking || !account}
                      className="btn-primary sm:flex-[2]"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Pinning…
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Pin to the card
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-ink-400 text-[0.72rem] tracking-wide">
                    Pinning is free — costs only Sui gas + Walrus storage
                  </p>
                </div>
              )}

              {status && (
                <p
                  className={`text-center text-xs font-mono px-4 py-3 rounded-xl break-all leading-relaxed border ${
                    statusKind === "error"
                      ? "border-rosegold/30 bg-rosegold/[0.06] text-rosegold"
                      : statusKind === "success"
                      ? "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300"
                      : "border-white/10 bg-white/[0.03] text-ink-200"
                  }`}
                >
                  {status}
                </p>
              )}

              {paymentDigest && !generatedImageUrl && (
                <a
                  href={`${config.sui.explorerUrl}/tx/${paymentDigest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-[0.7rem] text-ink-400 hover:text-ink-200 transition-colors font-mono"
                >
                  <ExternalLink className="w-3 h-3" />
                  Payment receipt · {paymentDigest.slice(0, 10)}…{paymentDigest.slice(-6)}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({
  num,
  shortLabel,
  label,
  active,
  done,
}: {
  num: number;
  shortLabel: string;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl border transition-colors min-w-0 ${
        done
          ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300"
          : active
          ? "border-ember/40 bg-ember/[0.06] text-ember-glow"
          : "border-white/10 bg-white/[0.02] text-ink-400"
      }`}
    >
      <span
        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[0.65rem] font-bold ${
          done
            ? "bg-emerald-500/30 text-emerald-300"
            : active
            ? "bg-gradient-celebration text-white"
            : "bg-white/5 text-ink-400"
        }`}
      >
        {done ? <Check className="w-3 h-3" /> : num}
      </span>
      <span className="truncate sm:hidden">{shortLabel}</span>
      <span className="hidden sm:inline truncate">{label}</span>
    </div>
  );
}
