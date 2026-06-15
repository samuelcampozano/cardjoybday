"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { X, Copy, Check, ExternalLink, Sparkles, ArrowRight } from "lucide-react";
import { config } from "@/lib/config";

interface Props {
  onClose: () => void;
}

export default function CreatePlanModal({ onClose }: Props) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: { showEffects: true, showObjectChanges: true },
      }),
  });

  const [birthdayPerson, setBirthdayPerson] = useState("");
  const [planId, setPlanId] = useState("");
  const [planLink, setPlanLink] = useState("");
  const [txDigest, setTxDigest] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [status, setStatus] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [recentPlan, setRecentPlan] = useState<{
    id: string;
    link: string;
    title: string;
    createdAt: number;
  } | null>(null);

  // Closing the modal mid-transaction or after success would lose the
  // invite link. Allow backdrop close ONLY when the user hasn't started
  // anything yet — the X button always works.
  const canCloseFromBackdrop = !isCreating && !planLink && !status;

  // Load any previously created plan from localStorage so it's still
  // reachable if the modal was dismissed accidentally last time.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("cardjoy:last-plan");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.id && parsed?.link) setRecentPlan(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist a successful create so backdrop-close (or any later crash)
  // can never lose the link.
  useEffect(() => {
    if (!planId || !planLink) return;
    try {
      window.localStorage.setItem(
        "cardjoy:last-plan",
        JSON.stringify({
          id: planId,
          link: planLink,
          title: birthdayPerson
            ? `Birthday Surprise for ${birthdayPerson}`
            : "Birthday Surprise",
          digest: txDigest,
          createdAt: Date.now(),
        })
      );
    } catch {
      /* ignore */
    }
  }, [planId, planLink, txDigest, birthdayPerson]);

  const handleCreate = () => {
    if (!birthdayPerson.trim() || !account) return;
    setIsCreating(true);
    setStatus("Waiting for wallet signature…");

    const tx = new Transaction();
    tx.moveCall({
      target: config.sui.moveTargets.createPlan,
      arguments: [tx.pure.string(`Birthday Surprise for ${birthdayPerson}`)],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result: any) => {
          const digest: string = result.digest ?? "";
          setTxDigest(digest);

          const objectChanges = (result.objectChanges ?? []) as Array<{
            type: string;
            objectId?: string;
            owner?: unknown;
          }>;
          const sharedChange = objectChanges.find(
            (c) =>
              c.type === "created" &&
              typeof c.owner === "object" &&
              c.owner !== null &&
              "Shared" in (c.owner as object)
          );

          const created = (result.effects?.created ?? []) as Array<{
            owner: unknown;
            reference: { objectId: string };
          }>;
          const sharedEffect = created.find(
            (obj) =>
              obj.owner === "Shared" ||
              (typeof obj.owner === "object" &&
                obj.owner !== null &&
                "Shared" in (obj.owner as object))
          );

          const foundId: string =
            sharedChange?.objectId ?? sharedEffect?.reference?.objectId ?? "";

          if (foundId) {
            setPlanId(foundId);
            setPlanLink(`${window.location.origin}/plan/${foundId}`);
            setStatus("");
          } else {
            setStatus(
              "Plan is on-chain — we couldn't auto-read the ID. Open the explorer link below to grab the shared object ID, then visit /plan/<id>."
            );
          }
          setIsCreating(false);
        },
        onError: (err) => {
          setStatus("Transaction failed: " + err.message);
          setIsCreating(false);
        },
      }
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(planLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(planId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={canCloseFromBackdrop ? onClose : undefined}
        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-md bg-ink-900 sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl max-h-[92vh] overflow-y-auto"
        >
          {/* Top gradient bar */}
          <div className="h-1 w-full bg-gradient-celebration sm:rounded-t-3xl" />

          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full text-ink-300 hover:text-ink-50 hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            <div className="mb-1.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ember" />
              <span className="eyebrow">New surprise</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-50 mb-2 leading-tight">
              Create a <span className="italic text-gradient">CardJoy</span>
            </h2>
            <p className="text-ink-300 text-sm leading-relaxed mb-6">
              We&apos;ll mint a shared plan on Sui and give you one link to send
              the whole group.
            </p>

            {/* ── Recovery: prior plan from localStorage ── */}
            {recentPlan && !planLink && !status && !isCreating && (
              <div className="mb-5 rounded-2xl border border-sungold/25 bg-sungold/[0.05] p-3.5">
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-sungold font-medium mb-1">
                  Your last plan
                </p>
                <p className="text-sm text-ink-100 font-medium leading-tight mb-1.5 truncate">
                  {recentPlan.title}
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={recentPlan.link}
                    className="flex-1 text-[0.72rem] font-mono text-ink-300 hover:text-ink-100 transition-colors truncate"
                  >
                    {recentPlan.link.replace(/^https?:\/\//, "")}
                  </a>
                  <a
                    href={recentPlan.link}
                    className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-celebration text-white text-[0.7rem] font-semibold shadow-glow-rose hover:-translate-y-0.5 transition-transform"
                  >
                    Open
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* ── Form ── */}
            {!planLink && !status && (
              <div className="space-y-5">
                {!account ? (
                  <div className="space-y-3">
                    <p className="text-sm text-ink-200">
                      Connect your wallet to begin:
                    </p>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex justify-center">
                      <ConnectButton />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-ink-400 font-medium mb-2.5">
                        Whose birthday is it?
                      </label>
                      <input
                        type="text"
                        value={birthdayPerson}
                        onChange={(e) => setBirthdayPerson(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        placeholder="E.g., Maria"
                        autoFocus
                        className="input-dark"
                      />
                    </div>
                    <button
                      onClick={handleCreate}
                      disabled={isCreating || !birthdayPerson.trim()}
                      className="btn-primary w-full"
                    >
                      {isCreating ? "Signing on Sui…" : "Create plan & get link"}
                      {!isCreating && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Signing ── */}
            {isCreating && (
              <p className="text-sm text-center text-ink-300 font-mono bg-white/[0.03] border border-white/10 px-4 py-3 rounded-xl mt-4 animate-pulse">
                {status}
              </p>
            )}

            {/* ── Success ── */}
            {planLink && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <p className="text-emerald-300 font-medium text-sm">
                      Live on Sui Testnet
                    </p>
                  </div>
                  <p className="text-ink-300 text-xs leading-relaxed">
                    Share the link below — friends drop their AI collages straight
                    into the plan.
                  </p>
                </div>

                {/* Invite link */}
                <div>
                  <p className="eyebrow mb-2">Invite link</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={planLink}
                      className="input-dark text-xs font-mono truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      title="Copy"
                      className="flex-shrink-0 p-3 rounded-xl bg-gradient-celebration text-white hover:opacity-90 transition-opacity shadow-glow-rose"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <a
                  href={planLink}
                  className="btn-primary w-full"
                >
                  Open the plan
                  <ArrowRight className="w-4 h-4" />
                </a>

                {/* Meta */}
                <div className="space-y-2 pt-3 border-t border-white/[0.06]">
                  {txDigest && (
                    <a
                      href={`${config.sui.explorerUrl}/tx/${txDigest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 text-[0.72rem] text-ink-400 hover:text-ink-200 font-mono transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <ExternalLink className="w-3 h-3" /> Transaction
                      </span>
                      <span>{txDigest.slice(0, 10)}…{txDigest.slice(-6)}</span>
                    </a>
                  )}
                  {planId && (
                    <div className="flex items-center justify-between gap-2 text-[0.72rem] text-ink-400 font-mono">
                      <a
                        href={`${config.sui.explorerUrl}/object/${planId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-ink-200 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Plan object
                      </a>
                      <button
                        onClick={handleCopyId}
                        className="flex items-center gap-1 hover:text-ink-200 transition-colors"
                      >
                        {planId.slice(0, 10)}…{planId.slice(-6)}
                        {copiedId ? (
                          <Check className="w-3 h-3 text-emerald-400 ml-1" />
                        ) : (
                          <Copy className="w-3 h-3 ml-1" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Fallback ── */}
            {status && !isCreating && !planLink && (
              <div className="space-y-4 mt-2">
                <div className="rounded-2xl border border-sungold/30 bg-sungold/[0.07] p-4">
                  <p className="text-sungold font-medium text-sm mb-1">
                    Plan created on-chain
                  </p>
                  <p className="text-ink-300 text-xs leading-relaxed">{status}</p>
                </div>
                {txDigest && (
                  <a
                    href={`${config.sui.explorerUrl}/tx/${txDigest}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open transaction
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
