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
import { config } from "@/lib/config";
import { walrusBlobUrl } from "@/lib/walrus";
import {
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Wallet,
  Crown,
  Gift,
  Loader2,
  MessageCircle,
  Wand2,
  Send,
} from "lucide-react";

const FEE_SUI = Number(config.sui.feeMist) / 1_000_000_000;

interface WishFields {
  contributor: string;
  text: string;
}

interface PlanFields {
  title: string;
  creator: string;
  recipient: string | null;
  wishes: Array<{ fields: WishFields }>;
  final_card_blob_id: string | null;
  is_finalized: boolean;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

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

function extractOption<T>(opt: any): T | null {
  if (!opt) return null;
  if (Array.isArray(opt)) return opt.length > 0 ? opt[0] : null;
  const vec = opt.vec ?? opt.fields?.vec;
  if (Array.isArray(vec)) return vec.length > 0 ? vec[0] : null;
  return null;
}

function isValidSuiAddress(addr: string) {
  return /^0x[0-9a-fA-F]{1,64}$/.test(addr.trim());
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

  const planFields = useMemo<PlanFields | null>(() => {
    const content = planData?.data?.content;
    if (content?.dataType !== "moveObject") return null;
    const f = content.fields as any;
    return {
      title: f.title,
      creator: f.creator,
      recipient: extractOption<string>(f.recipient),
      wishes: f.wishes ?? [],
      final_card_blob_id: extractOption<string>(f.final_card_blob_id),
      is_finalized: !!f.is_finalized,
    };
  }, [planData]);

  const isCreator =
    !!account && !!planFields && account.address.toLowerCase() === planFields.creator.toLowerCase();
  const isFinalized = planFields?.is_finalized ?? false;
  const wishCount = planFields?.wishes.length ?? 0;

  // ── Add-wish state ──
  const [wishText, setWishText] = useState("");
  const [isAddingWish, setIsAddingWish] = useState(false);
  const [wishStatus, setWishStatus] = useState("");
  const [wishStatusKind, setWishStatusKind] = useState<"info" | "error" | "success">("info");

  // ── Finalize state ──
  const [showFinalize, setShowFinalize] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [finalizeStep, setFinalizeStep] = useState<
    "idle" | "paying" | "generating" | "preview" | "sealing"
  >("idle");
  const [paymentDigest, setPaymentDigest] = useState("");
  const [generatedBlobId, setGeneratedBlobId] = useState("");
  const [generatedPreview, setGeneratedPreview] = useState("");
  const [finalizeError, setFinalizeError] = useState("");

  const [copied, setCopied] = useState(false);

  const contributors = useMemo(() => {
    if (!planFields) return [];
    const set = new Set<string>();
    set.add(planFields.creator);
    for (const w of planFields.wishes) set.add(w.fields.contributor);
    return Array.from(set);
  }, [planFields]);

  const shareLink =
    typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const setWishMsg = (msg: string, kind: "info" | "error" | "success" = "info") => {
    setWishStatus(msg);
    setWishStatusKind(kind);
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

  // ── Add wish (free, anyone with a wallet) ──
  const handleAddWish = async () => {
    if (!wishText.trim() || !account || isAddingWish) return;
    setIsAddingWish(true);
    setWishMsg("Sign your wish onto Sui…");

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: config.sui.moveTargets.addWish,
        arguments: [tx.object(planId), tx.pure.string(wishText.trim())],
      });
      await signTx(tx);
      setWishText("");
      setWishMsg("Wish pinned on-chain. 🎉", "success");
      setTimeout(() => refetch(), 2000);
    } catch (err: any) {
      setWishMsg(
        err?.message?.includes("Reject")
          ? "Cancelled — your wish wasn't sent."
          : "Failed: " + (err?.message ?? err),
        "error"
      );
    } finally {
      setIsAddingWish(false);
    }
  };

  // ── Finalize: pay + generate composite card ──
  const handlePayAndGenerate = async () => {
    if (!account || !planFields || !isCreator) return;
    if (!isValidSuiAddress(recipient)) {
      setFinalizeError("Recipient must be a valid Sui address (0x…).");
      return;
    }
    if (wishCount === 0) {
      setFinalizeError("Wait for at least one wish before sealing the card.");
      return;
    }

    setFinalizeError("");
    setFinalizeStep("paying");

    let digest = "";
    try {
      const payTx = new Transaction();
      const [coin] = payTx.splitCoins(payTx.gas, [
        payTx.pure.u64(config.sui.feeMist),
      ]);
      payTx.transferObjects([coin], config.sui.treasuryAddress);
      const result = await signTx(payTx);
      digest = result.digest;
      setPaymentDigest(digest);
    } catch (err: any) {
      setFinalizeError(
        err?.message?.includes("Reject")
          ? "Payment cancelled — no charge."
          : "Payment failed: " + (err?.message ?? err)
      );
      setFinalizeStep("idle");
      return;
    }

    setFinalizeStep("generating");
    try {
      const res = await fetch("/api/finalize-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTitle: planFields.title,
          wishes: planFields.wishes.map((w) => w.fields.text),
          paymentDigest: digest,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setGeneratedBlobId(data.blobId);
      setGeneratedPreview(data.imageUrl);
      setFinalizeStep("preview");
    } catch (err: any) {
      setFinalizeError(
        "Generation failed: " +
          (err?.message ?? err) +
          " — your payment receipt is still valid; you can retry."
      );
      setFinalizeStep("idle");
    }
  };

  // ── Finalize: sign finalize_card transaction ──
  const handleSealCard = async () => {
    if (!account || !generatedBlobId || !isValidSuiAddress(recipient)) return;
    setFinalizeStep("sealing");
    setFinalizeError("");

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: config.sui.moveTargets.finalizeCard,
        arguments: [
          tx.object(planId),
          tx.pure.string(generatedBlobId),
          tx.pure.address(recipient.trim()),
        ],
      });
      await signTx(tx);
      setShowFinalize(false);
      setFinalizeStep("idle");
      setTimeout(() => refetch(), 2500);
    } catch (err: any) {
      setFinalizeError("Sealing failed: " + (err?.message ?? err));
      setFinalizeStep("preview");
    }
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
        <p className="text-ink-300 text-sm max-w-sm font-mono break-all">{planId}</p>
        <p className="text-ink-400 text-xs max-w-sm">
          Make sure the contract is deployed and this plan was created on the same network.
        </p>
      </div>
    );
  }

  const displayTitle = planFields.title.replace(/^Birthday Surprise for /i, "");

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-24">
      {/* ── Header ── */}
      <header className="max-w-4xl mx-auto px-5 sm:px-6 mb-10">
        <div className="flex items-center gap-2 mb-3 text-[0.7rem] uppercase tracking-[0.2em] flex-wrap">
          {isFinalized ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 normal-case tracking-normal text-[0.7rem]">
              <ShieldCheck className="w-3 h-3" /> Sealed · Sent on-chain
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ember" />
              </span>
              <span className="text-ink-300 font-medium">Gathering wishes · Sui Testnet</span>
            </span>
          )}
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
              {displayTitle}{" "}
              <span className="italic text-gradient">birthday</span>
            </h1>
            <p className="text-ink-400 text-xs mt-3 font-mono flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-sungold" />
              Started by {shortenAddress(planFields.creator)}
              {isCreator && (
                <span className="text-sungold normal-case tracking-normal ml-1">(you)</span>
              )}
            </p>
            {planFields.recipient && (
              <p className="text-ink-400 text-xs mt-1.5 font-mono flex items-center gap-1.5">
                <Gift className="w-3 h-3 text-ember" />
                For {shortenAddress(planFields.recipient)}
              </p>
            )}
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
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-celebration text-white text-xs font-semibold shadow-glow-rose transition-all hover:-translate-y-0.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy invite link"}
            </button>
          </div>
        </div>

        {/* Contributor strip */}
        <div className="mt-6 flex items-center gap-4 flex-wrap">
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
            <MessageCircle className="w-3.5 h-3.5" />
            <span>
              <span className="text-ink-50 font-medium">{contributors.length}</span>{" "}
              {contributors.length === 1 ? "friend" : "friends"} ·{" "}
              <span className="text-ink-50 font-medium">{wishCount}</span>{" "}
              {wishCount === 1 ? "wish" : "wishes"} so far
            </span>
          </div>
        </div>

        <div className="divider-hairline mt-8" />
      </header>

      {/* ── Final card hero (only when finalized) ── */}
      {isFinalized && planFields.final_card_blob_id && (
        <section className="max-w-4xl mx-auto px-5 sm:px-6 mb-16">
          <div className="rounded-3xl glass-card overflow-hidden">
            <div className="h-1 w-full bg-gradient-celebration" />
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-4 h-4 text-ember" />
                <span className="eyebrow">The final card</span>
              </div>
              <img
                src={walrusBlobUrl(planFields.final_card_blob_id)}
                alt={`Birthday card for ${displayTitle}`}
                className="w-full rounded-2xl border border-white/10 mb-5"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 text-[0.72rem] text-ink-400 font-mono">
                <span>
                  Stored forever on Walrus ·{" "}
                  <a
                    href={walrusBlobUrl(planFields.final_card_blob_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-200 hover:text-gradient transition-colors inline-flex items-center gap-1"
                  >
                    open blob <ExternalLink className="w-3 h-3" />
                  </a>
                </span>
                <a
                  href={`${config.sui.explorerUrl}/object/${planId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ink-200 inline-flex items-center gap-1"
                >
                  on Sui <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Wishes wall ── */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 mb-16">
        <div className="flex items-baseline justify-between mb-6">
          <p className="eyebrow">
            {isFinalized ? "Wishes that made the card" : "Wishes so far"}
          </p>
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

        {wishCount === 0 ? (
          <div className="rounded-3xl glass-card p-10 text-center">
            <Sparkles className="w-6 h-6 text-ember mx-auto mb-3" />
            <p className="font-display text-2xl text-ink-50 mb-1">No wishes yet.</p>
            <p className="text-ink-400 text-sm max-w-sm mx-auto">
              Share the invite link with friends — the first wish kicks off the card.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {planFields.wishes.map((item, i) => (
              <article
                key={i}
                className="rounded-2xl glass-card p-5 flex gap-3 items-start"
              >
                <span
                  className={`flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(
                    item.fields.contributor
                  )} flex items-center justify-center text-[0.7rem] font-mono text-white shadow-soft-card`}
                >
                  {item.fields.contributor.slice(2, 4)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink-100 text-sm leading-relaxed mb-2 whitespace-pre-wrap break-words">
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

      {/* ── Add a wish (visible while not finalized) ── */}
      {!isFinalized && (
        <section className="max-w-4xl mx-auto px-5 sm:px-6 mb-12">
          <div className="relative rounded-3xl glass-card overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-celebration" />
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-ember" />
                <span className="eyebrow">Your wish</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-ink-50 mb-2 leading-tight">
                Add your <span className="italic text-gradient">wish</span>
              </h2>
              <p className="text-ink-300 text-sm mb-5 max-w-xl leading-relaxed">
                Free to add — just gas. Your text is pinned to Sui forever and feeds
                into the AI birthday card the creator will generate when everyone&apos;s in.
              </p>

              <div className="mb-4">
                <ConnectButton />
              </div>

              <div className="space-y-4">
                <textarea
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  placeholder="E.g., Happy 30th Maria! Wishing you a year of disco nights and surprise cakes…"
                  disabled={!account || isAddingWish}
                  maxLength={280}
                  className="input-dark h-28 resize-none disabled:opacity-40"
                />
                <div className="flex items-center justify-between text-[0.7rem] text-ink-400">
                  <span>{wishText.length}/280</span>
                  {!account && (
                    <span className="flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      Connect a wallet to sign
                    </span>
                  )}
                </div>

                <button
                  onClick={handleAddWish}
                  disabled={isAddingWish || !wishText.trim() || !account}
                  className="btn-primary w-full"
                >
                  {!account ? (
                    <>
                      <Wallet className="w-4 h-4" />
                      Connect wallet to add your wish
                    </>
                  ) : isAddingWish ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Add my wish to the card
                    </>
                  )}
                </button>

                {wishStatus && (
                  <p
                    className={`text-center text-xs font-mono px-4 py-3 rounded-xl break-all leading-relaxed border ${
                      wishStatusKind === "error"
                        ? "border-rosegold/30 bg-rosegold/[0.06] text-rosegold"
                        : wishStatusKind === "success"
                        ? "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300"
                        : "border-white/10 bg-white/[0.03] text-ink-200"
                    }`}
                  >
                    {wishStatus}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Finalize panel (creator-only, while not finalized) ── */}
      {isCreator && !isFinalized && (
        <section className="max-w-4xl mx-auto px-5 sm:px-6">
          <div className="rounded-3xl border border-sungold/25 bg-sungold/[0.04] overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-sungold" />
                <span className="eyebrow text-sungold">Creator only</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-ink-50 mb-2 leading-tight">
                Seal &amp; send the <span className="italic text-gradient">card</span>
              </h2>
              <p className="text-ink-300 text-sm mb-5 max-w-xl leading-relaxed">
                When everyone&apos;s wishes are in, pay {FEE_SUI} SUI to generate
                one AI birthday card from all {wishCount} {wishCount === 1 ? "wish" : "wishes"}.
                The card is pinned to Walrus and the plan is addressed to the
                recipient on-chain.
              </p>

              {!showFinalize ? (
                <button
                  onClick={() => setShowFinalize(true)}
                  disabled={wishCount === 0}
                  className="btn-primary"
                >
                  <Wand2 className="w-4 h-4" />
                  Finalize the card
                </button>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-400 font-medium mb-2">
                      Recipient&apos;s Sui address
                    </label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => {
                        setRecipient(e.target.value);
                        setFinalizeError("");
                      }}
                      placeholder="0x…"
                      disabled={finalizeStep !== "idle" && finalizeStep !== "preview"}
                      className="input-dark text-sm font-mono"
                    />
                    <p className="text-[0.7rem] text-ink-400 mt-1.5">
                      Stored on-chain so anyone reading the plan knows who it&apos;s for.
                    </p>
                  </div>

                  {finalizeStep === "idle" && (
                    <button
                      onClick={handlePayAndGenerate}
                      disabled={!recipient.trim() || wishCount === 0}
                      className="btn-primary w-full"
                    >
                      <Wand2 className="w-4 h-4" />
                      Pay {FEE_SUI} SUI &amp; generate the card
                    </button>
                  )}

                  {finalizeStep === "paying" && (
                    <div className="flex items-center justify-center gap-2 text-sm text-ink-200 py-3 bg-white/[0.03] rounded-xl border border-white/10">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Confirm {FEE_SUI} SUI in your wallet…
                    </div>
                  )}

                  {finalizeStep === "generating" && (
                    <div className="flex items-center justify-center gap-2 text-sm text-ink-200 py-3 bg-white/[0.03] rounded-xl border border-white/10">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating your card &amp; pinning to Walrus…
                    </div>
                  )}

                  {finalizeStep === "preview" && generatedPreview && (
                    <div className="space-y-3">
                      <div className="rounded-2xl overflow-hidden border border-white/10">
                        <img
                          src={generatedPreview}
                          alt="Generated birthday card preview"
                          className="w-full"
                        />
                      </div>
                      <p className="text-center text-ink-400 text-[0.72rem] tracking-wide">
                        Stored on Walrus · sign the final transaction to seal it on Sui
                      </p>
                      <button
                        onClick={handleSealCard}
                        className="btn-primary w-full"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Seal &amp; send to {shortenAddress(recipient)}
                      </button>
                    </div>
                  )}

                  {finalizeStep === "sealing" && (
                    <div className="flex items-center justify-center gap-2 text-sm text-ink-200 py-3 bg-white/[0.03] rounded-xl border border-white/10">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sealing on Sui…
                    </div>
                  )}

                  {finalizeError && (
                    <p className="text-center text-xs font-mono px-4 py-3 rounded-xl break-all leading-relaxed border border-rosegold/30 bg-rosegold/[0.06] text-rosegold">
                      {finalizeError}
                    </p>
                  )}

                  {paymentDigest && finalizeStep !== "idle" && (
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
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
