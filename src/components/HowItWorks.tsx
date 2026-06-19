"use client";

import { motion } from "framer-motion";
import { Sparkles, Image as ImageIcon, Users } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Spin up a plan",
    body: "Connect your wallet and create a shared Sui object for the birthday person. You get a single invite link to share with everyone.",
    icon: Sparkles,
    accent: "from-ember to-rosegold",
  },
  {
    n: "02",
    title: "Friends drop wishes",
    body: "Each contributor writes a personal wish and signs it directly into the Sui plan. Adding a wish is free — friends only pay minimal network gas.",
    icon: ImageIcon,
    accent: "from-rosegold to-iris",
  },
  {
    n: "03",
    title: "Reveal together",
    body: "On the big day, open the plan link and watch every wish bloom in a single shared canvas. Nothing to download. Nothing to lose.",
    icon: Users,
    accent: "from-iris to-sungold",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 sm:py-32 border-t border-white/[0.06]"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="text-center mb-16 sm:mb-24">
          <p className="eyebrow mb-4">The flow</p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium text-ink-50 leading-[1.05] max-w-3xl mx-auto">
            Three signatures.
            <br />
            <span className="italic font-light text-gradient">One unforgettable moment.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="group relative rounded-3xl glass-card p-7 sm:p-8 overflow-hidden"
              >
                {/* Hover gradient wash */}
                <div
                  className={`absolute -inset-px rounded-3xl bg-gradient-to-br ${step.accent} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`}
                />
                {/* Step number */}
                <div className="relative flex items-start justify-between mb-12">
                  <span className="font-display text-6xl sm:text-7xl font-light text-ink-700 leading-none tabular-nums">
                    {step.n}
                  </span>
                  <span
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${step.accent} shadow-soft-card`}
                  >
                    <Icon className="w-5 h-5 text-ink-50" />
                  </span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl text-ink-50 mb-3 leading-tight">
                  {step.title}
                </h3>
                <p className="text-ink-300 text-[0.95rem] leading-relaxed">
                  {step.body}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
