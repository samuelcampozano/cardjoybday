"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";

import { ConnectButton } from "@mysten/dapp-kit";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "glass-morphism py-3 shadow-sm" : "bg-transparent py-5"}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="cardjoy logo" className="w-10 h-10 object-contain rounded-full bg-white shadow-sm" />
          <span className="font-heading text-xl font-bold tracking-tight text-slate-900">cardjoy<span className="text-brand-pink">bday</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="#how-it-works" className="hover:text-brand-blue transition-colors">How it Works</Link>
          <Link href="#tech" className="hover:text-brand-pink transition-colors">Tech</Link>
        </div>

        <div className="scale-90 origin-right">
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
