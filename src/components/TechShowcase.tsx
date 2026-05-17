"use client";

import { motion } from "framer-motion";

export default function TechShowcase() {
  return (
    <section id="tech" className="py-24 bg-brand-cream border-y border-brand-orange/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 rounded-full bg-brand-blue/20 text-brand-blue text-sm font-bold tracking-wider mb-6">
                TECH SHOWCASE
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold mb-8">
                Built for the <br />
                <span className="text-brand-teal">Next Generation.</span>
              </h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-bold text-brand-orange">W</div>
                  <div>
                    <h4 className="font-bold text-xl mb-2">Walrus Storage</h4>
                    <p className="text-slate-400 leading-relaxed">
                      All your photos, high-res videos, and personalized audio are stored on <b>Walrus</b>. 
                      It's decentralized, permanent, and lightning-fast. No lost memories, ever.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-bold text-brand-blue">S</div>
                  <div>
                    <h4 className="font-bold text-xl mb-2">Sui Network</h4>
                    <p className="text-slate-400 leading-relaxed">
                      The collaborative "Surprise Party Planner" is built on <b>Sui's Object Model</b>. 
                      Every friend's contribution is an on-chain event, enabling seamless real-time co-creation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 font-mono text-xs md:text-sm text-brand-teal overflow-x-auto shadow-2xl">
              <pre><code>{`// Sample Walrus Storage Hook
const storeOnWalrus = async (data) => {
  const response = await fetch(WALRUS_URL, {
    method: 'PUT',
    body: data
  });
  return response.json();
};

// Sui Collaborative Object
public entry fun add_idea(
  plan: &mut SurprisePlan, 
  idea: String,
  ctx: &mut TxContext
) {
  let contributor = tx_context::sender(ctx);
  plan.ideas.push_back(Idea { contributor, idea });
}`}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
