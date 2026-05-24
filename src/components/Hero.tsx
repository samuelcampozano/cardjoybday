"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Send } from "lucide-react";

interface Props {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export default function Hero({ onCreateClick, onJoinClick }: Props) {
  return (
    <section className="relative pt-32 sm:pt-36 pb-20 sm:pb-28 overflow-hidden">
      {/* Editorial grid lines */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "120px 100%",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ember" />
            </span>
            <span className="text-[0.72rem] uppercase tracking-[0.18em] text-ink-200 font-medium">
              Live on Sui Testnet · Sui Overflow 2026
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="font-display text-center text-[2.6rem] leading-[1.02] sm:text-6xl md:text-7xl lg:text-[5.5rem] font-medium text-ink-50 max-w-5xl mx-auto"
        >
          Birthday wishes,
          <br />
          <span className="italic font-light text-gradient">forever</span>{" "}
          on-chain.
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mt-7 sm:mt-8 max-w-2xl mx-auto text-center text-base sm:text-lg text-ink-300 leading-relaxed px-2"
        >
          Spin up a shared surprise plan, invite the whole group, and let
          everyone drop an AI-generated collage — stored permanently on{" "}
          <span className="text-ink-50">Walrus</span> and signed onto{" "}
          <span className="text-ink-50">Sui</span>.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto"
        >
          <button onClick={onCreateClick} className="btn-primary group">
            <Sparkles className="w-4 h-4" />
            <span>Create a CardJoy</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button onClick={onJoinClick} className="btn-secondary group">
            <Send className="w-4 h-4 -rotate-12" />
            <span>Join a Surprise</span>
          </button>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-6 flex justify-center"
        >
          <p className="text-[0.7rem] text-ink-400 uppercase tracking-widest">
            Free to create · 0.01 SUI per AI collage
          </p>
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-16 sm:mt-24 flex justify-center"
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative w-full max-w-2xl aspect-[4/3] sm:aspect-[16/10]">
      {/* Soft glow halo */}
      <div className="absolute inset-x-10 -inset-y-4 sm:inset-x-20 sm:-inset-y-8 bg-gradient-celebration blur-3xl opacity-25 rounded-full -z-10" />

      {/* Back card */}
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [-7, -7, -7] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-2 top-6 sm:left-8 sm:top-10 w-[60%] sm:w-[55%] aspect-[4/5] rounded-[1.5rem] glass-card -rotate-[7deg]"
      >
        <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-iris/15 via-transparent to-rosegold/10" />
      </motion.div>

      {/* Middle card */}
      <motion.div
        animate={{ y: [0, 6, 0], rotate: [5, 5, 5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        className="absolute right-2 top-2 sm:right-8 sm:top-4 w-[60%] sm:w-[55%] aspect-[4/5] rounded-[1.5rem] glass-card rotate-[5deg]"
      >
        <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-ember/15 via-transparent to-iris/10" />
      </motion.div>

      {/* Front featured card */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        className="absolute inset-x-0 mx-auto top-0 w-[70%] sm:w-[58%] aspect-[4/5] rounded-[1.75rem] overflow-hidden glass-card shadow-soft-card"
      >
        {/* Top gradient bar */}
        <div className="h-2 w-full bg-gradient-celebration" />

        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <p className="eyebrow text-[0.6rem] mb-2">Surprise plan · 4 friends</p>
          <h3 className="font-display text-lg sm:text-2xl leading-tight text-ink-50">
            For Maria&apos;s <span className="italic text-gradient">30th</span>
          </h3>
        </div>

        {/* Image grid */}
        <div className="px-5 grid grid-cols-2 gap-1.5">
          {[
            "from-ember/80 to-rosegold/80",
            "from-rosegold/80 to-iris/80",
            "from-iris/80 to-sungold/70",
            "from-sungold/80 to-ember/70",
          ].map((g, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg bg-gradient-to-br ${g} relative overflow-hidden`}
            >
              <div className="absolute inset-0 mix-blend-overlay opacity-50"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)",
                }}
              />
            </div>
          ))}
        </div>

        {/* Footer row */}
        <div className="px-5 pt-3 pb-4 flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {["#FF6B5C", "#FF4D8D", "#9B6FFF", "#F5C572"].map((c, i) => (
              <span
                key={i}
                className="w-5 h-5 rounded-full border border-ink-900"
                style={{ background: c }}
              />
            ))}
          </div>
          <span className="text-[0.6rem] font-mono text-ink-400">
            0x540a…2dfb
          </span>
        </div>
      </motion.div>

      {/* Floating candle (above front card) */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 -top-2 sm:-top-3 -translate-x-1/2 flex flex-col items-center"
      >
        <span className="candle-flame" />
        <span className="mt-2 w-1 h-7 sm:h-9 bg-gradient-to-b from-ink-50 to-ink-300 rounded-sm shadow-[0_0_6px_rgba(255,200,150,0.45)]" />
      </motion.div>

      {/* Drifting sparkles */}
      {[
        { left: "10%", top: "30%", delay: 0 },
        { left: "85%", top: "55%", delay: 1.2 },
        { left: "20%", top: "75%", delay: 0.6 },
        { left: "75%", top: "20%", delay: 1.8 },
      ].map((p, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: [-10, -40] }}
          transition={{ duration: 3.5, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
          className="absolute w-1 h-1 rounded-full bg-sungold shadow-[0_0_10px_4px_rgba(245,197,114,0.5)]"
          style={{ left: p.left, top: p.top }}
        />
      ))}
    </div>
  );
}
