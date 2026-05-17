"use client";

import { motion } from "framer-motion";
import { Upload, Palette, Users } from "lucide-react";

const steps = [
  {
    title: "Upload Memories",
    description: "Drag and drop your favorite photos, videos, and voice notes. They're safely stored forever on Walrus.",
    icon: <Upload className="w-8 h-8 text-brand-blue" />,
    color: "bg-blue-50",
  },
  {
    title: "Decorate & Animate",
    description: "Choose from hand-drawn themes, interactive candles, and background tunes that fit their personality.",
    icon: <Palette className="w-8 h-8 text-brand-pink" />,
    color: "bg-pink-50",
  },
  {
    title: "Collaborate Together",
    description: "The Surprise Planner lets friends suggest gift ideas and favorite memories to build a collective masterpiece.",
    icon: <Users className="w-8 h-8 text-brand-teal" />,
    color: "bg-teal-50",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">Making magic is easy</h2>
          <p className="text-slate-500 text-lg">Three steps to the best birthday gift they've ever received.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="flex flex-col items-center text-center p-8 rounded-[2.5rem] hover:bg-slate-50 transition-colors"
            >
              <div className={`w-20 h-20 ${step.color} rounded-3xl flex items-center justify-center mb-8 shadow-sm`}>
                {step.icon}
              </div>
              <h3 className="font-heading text-2xl font-bold mb-4">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
