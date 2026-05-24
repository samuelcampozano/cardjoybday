"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Send } from "lucide-react";

interface Props {
  onClose: () => void;
}

function extractPlanId(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/plan\/(0x[0-9a-fA-F]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^0x[0-9a-fA-F]{10,}$/.test(trimmed)) return trimmed;
  return null;
}

export default function JoinPlanModal({ onClose }: Props) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleJoin = () => {
    const planId = extractPlanId(input);
    if (!planId) {
      setError("Paste the full invite link or the Sui object ID (starts with 0x).");
      return;
    }
    router.push(`/plan/${planId}`);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
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
          <div className="h-1 w-full bg-gradient-iris sm:rounded-t-3xl" />

          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full text-ink-300 hover:text-ink-50 hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            <div className="mb-1.5 flex items-center gap-2">
              <Send className="w-4 h-4 text-iris -rotate-12" />
              <span className="eyebrow">Join the celebration</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-50 mb-2 leading-tight">
              Got an <span className="italic text-gradient">invite?</span>
            </h2>
            <p className="text-ink-300 text-sm leading-relaxed mb-6">
              Paste the link your friend sent. We&apos;ll drop you straight into
              the plan so you can add your AI collage.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-400 font-medium mb-2.5">
                  Invite link or plan ID
                </label>
                <input
                  type="text"
                  value={input}
                  autoFocus
                  onChange={(e) => {
                    setInput(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="https://cardjoybday.com/plan/0x… or 0x…"
                  className="input-dark text-sm"
                />
                {error && (
                  <p className="text-rosegold text-xs mt-2">{error}</p>
                )}
              </div>

              <button
                onClick={handleJoin}
                disabled={!input.trim()}
                className="btn-primary w-full"
              >
                Join the celebration
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
