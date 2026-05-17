import { Github, PlayCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-16 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="flex items-center gap-2">
            <span className="font-heading text-2xl font-bold text-slate-900">cardjoy<span className="text-brand-pink">bday</span></span>
          </div>

          <div className="flex gap-8">
            <a href="#" className="flex items-center gap-2 text-slate-600 hover:text-brand-blue transition-colors font-medium">
              <Github size={20} />
              GitHub
            </a>
            <a href="#" className="flex items-center gap-2 text-slate-600 hover:text-brand-pink transition-colors font-medium">
              <PlayCircle size={20} />
              Demo Video
            </a>
          </div>

          <div className="flex items-center gap-3 bg-brand-cream px-4 py-2 rounded-2xl border border-brand-orange/20 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Powered by</span>
            <span className="font-heading text-sm font-bold text-brand-orange">SUI OVERFLOW 2026</span>
          </div>
        </div>

        <div className="text-center text-slate-400 text-sm">
          <p>© 2026 cardjoybday. Spreading digital joy across the Sui ecosystem.</p>
        </div>
      </div>
    </footer>
  );
}
