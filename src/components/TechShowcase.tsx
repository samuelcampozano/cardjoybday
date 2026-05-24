"use client";

import { motion } from "framer-motion";
import { config } from "@/lib/config";

const PACKAGE_SHORT = `${config.sui.packageId.slice(0, 6)}…${config.sui.packageId.slice(-4)}`;

const pillars = [
  {
    letter: "S",
    name: "Sui Object Model",
    body: "Each plan is a shared on-chain object. Every contribution is a signed transaction emitted as an event — auditable, immutable, and instantly readable from any RPC.",
    accent: "from-iris to-rosegold",
  },
  {
    letter: "W",
    name: "Walrus Storage",
    body: "AI-generated images are uploaded to Walrus testnet as decentralized blobs. The blob ID is what we store on Sui — so the picture outlives any server.",
    accent: "from-ember to-rosegold",
  },
  {
    letter: "P",
    name: "Pollinations FLUX",
    body: "Free image generation, no API key, no rate limit. Powered by FLUX.1-schnell — sized 1024×1024 and pinned to the user’s wallet-signed wish.",
    accent: "from-sungold to-ember",
  },
];

const code = `// surprise_planner.move
public entry fun add_idea(
    plan: &mut SurprisePlan,
    text: String,
    blob_id: String,
    ctx: &mut TxContext
) {
    let contributor = tx_context::sender(ctx);
    plan.ideas.push_back(Idea {
        contributor, text, blob_id
    });
    event::emit(IdeaAdded {
        plan_id: object::id(plan),
        contributor,
    });
}`;

export default function TechShowcase() {
  return (
    <section id="tech" className="relative py-24 sm:py-32 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-start">
          {/* Left column */}
          <div>
            <p className="eyebrow mb-4">Tech stack</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium text-ink-50 leading-[1.05] mb-10">
              No servers.{" "}
              <span className="italic font-light text-gradient">
                No vendor lock-in.
              </span>{" "}
              Just open protocols.
            </h2>

            <div className="space-y-5">
              {pillars.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-4"
                >
                  <span
                    className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${p.accent} flex items-center justify-center font-display text-xl text-ink-50 shadow-soft-card`}
                  >
                    {p.letter}
                  </span>
                  <div>
                    <h4 className="font-display text-xl text-ink-50 mb-1.5">
                      {p.name}
                    </h4>
                    <p className="text-ink-300 text-[0.93rem] leading-relaxed">
                      {p.body}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Code card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Glow */}
            <div className="absolute -inset-6 bg-gradient-celebration opacity-20 blur-3xl rounded-[3rem] -z-10" />

            <div className="rounded-2xl glass-card overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-ember/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-sungold/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-iris/70" />
                </div>
                <span className="font-mono text-[0.7rem] text-ink-400">
                  surprise_planner.move
                </span>
              </div>

              <pre className="p-5 sm:p-6 font-mono text-[0.78rem] sm:text-[0.85rem] leading-relaxed text-ink-200 overflow-x-auto">
                <code dangerouslySetInnerHTML={{ __html: highlightMove(code) }} />
              </pre>

              <div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-between gap-4 text-[0.72rem] text-ink-400">
                <span className="font-mono">
                  Package · {PACKAGE_SHORT}
                </span>
                <a
                  href={`${config.sui.explorerUrl}/object/${config.sui.packageId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-100 hover:text-gradient transition-colors"
                >
                  View on Suiscan →
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Super-light Move syntax coloring for visual flair
function highlightMove(src: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = esc(src);
  out = out.replace(
    /(\/\/[^\n]*)/g,
    '<span style="color:#6b6660">$1</span>'
  );
  out = out.replace(
    /\b(public|entry|fun|let|module|use|struct|has|copy|drop|store|key)\b/g,
    '<span style="color:#FF6B5C">$1</span>'
  );
  out = out.replace(
    /\b(plan|text|blob_id|ctx|contributor|plan_id)\b/g,
    '<span style="color:#9B6FFF">$1</span>'
  );
  out = out.replace(
    /(String|TxContext|SurprisePlan|Idea|IdeaAdded)/g,
    '<span style="color:#F5C572">$1</span>'
  );
  return out;
}
