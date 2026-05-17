"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Decorative Background Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0] 
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-20 -right-20 w-96 h-96 bg-brand-pink/10 rounded-full blur-3xl -z-10" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, -5, 0] 
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute bottom-10 -left-20 w-80 h-80 bg-brand-teal/10 rounded-full blur-3xl -z-10" 
      />

      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-heading text-5xl md:text-7xl font-bold leading-tight mb-6">
            Joyful Birthday Wishes, <br />
            <span className="text-gradient">Built Together.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
            Create interactive digital cards that bloom with memories. 
            Invite friends to collaborate on the ultimate surprise plan, 
            powered by the permanent magic of the blockchain.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          <button className="bg-brand-pink text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-pink-100 hover:bg-pink-600 transition-all hover:-translate-y-1">
            Create a cardjoy
          </button>
          <button className="bg-white border-2 border-brand-blue text-brand-blue px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all hover:-translate-y-1">
            Join a Surprise Plan
          </button>
        </motion.div>

        {/* Animated 3D-ish Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative w-full max-w-lg aspect-square"
        >
          <div className="absolute inset-0 bg-white/40 glass-morphism rounded-[3rem] -rotate-3 -z-10" />
          <div className="absolute inset-0 bg-white/60 glass-morphism rounded-[3rem] rotate-2 -z-10 shadow-xl" />
          
          <div className="w-full h-full flex items-center justify-center p-8">
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <svg viewBox="0 0 200 200" className="w-64 h-64 drop-shadow-2xl">
                <rect x="40" y="110" width="120" height="50" rx="8" fill="#F59E0B" />
                <rect x="60" y="80" width="80" height="40" rx="8" fill="#EC4899" />
                <rect x="85" y="60" width="6" height="20" rx="2" fill="#2DD4BF" />
                <rect x="109" y="60" width="6" height="20" rx="2" fill="#3B82F6" />
                <motion.circle 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 0.5 }} 
                  cx="88" cy="55" r="4" fill="#F59E0B" 
                />
                <motion.circle 
                  animate={{ scale: [1, 1.3, 1] }} 
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} 
                  cx="112" cy="55" r="4" fill="#F59E0B" 
                />
              </svg>
              <motion.div 
                animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-10 -right-10 text-4xl"
              >
                🎈
              </motion.div>
              <motion.div 
                animate={{ y: [10, -10, 10], x: [5, -5, 5] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                className="absolute top-20 -left-12 text-4xl"
              >
                🎁
              </motion.div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -bottom-4 -right-4 text-3xl"
              >
                ✨
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
