import { Github, PlayCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative pt-20 pb-10 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        {/* Mega wordmark */}
        <div className="text-center mb-14">
          <h2 className="font-display text-[18vw] sm:text-[14vw] lg:text-[11vw] leading-[0.9] font-light text-ink-50/90">
            cardjoy
            <span className="italic text-gradient">bday</span>
          </h2>
          <p className="mt-2 text-ink-400 text-sm tracking-wide">
            Birthday wishes, signed by friends, kept by the chain.
          </p>
        </div>

        <div className="divider-hairline mb-10" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <span className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-white p-0.5 ring-1 ring-white/20">
              <img src="/logo.png" alt="cardjoy" className="w-full h-full object-contain rounded-full" />
            </span>
            <span className="font-display text-base text-ink-100">
              cardjoy<span className="italic text-gradient">bday</span>
            </span>
          </span>

          <div className="flex items-center gap-5 text-sm text-ink-300">
            <a
              href="https://github.com/samuelcampozano"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-ink-50 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 hover:text-ink-50 transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Demo</span>
            </a>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-400">
              Built for
            </span>
            <span className="font-display text-sm text-gradient italic">
              Sui Overflow 2026
            </span>
          </div>
        </div>

        <p className="text-center text-ink-500 text-xs mt-10">
          © 2026 cardjoybday · Spreading on-chain joy.
        </p>
      </div>
    </footer>
  );
}
