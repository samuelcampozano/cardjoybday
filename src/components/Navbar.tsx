"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass-morphism py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="relative w-10 h-10 rounded-full bg-white p-0.5 ring-1 ring-white/20 shadow-[0_0_20px_-6px_rgba(255,77,141,0.45)] transition-transform group-hover:scale-105">
              <img
                src="/logo.png"
                alt="cardjoy"
                className="w-full h-full object-contain rounded-full"
              />
            </span>
            <span className="font-display text-[1.15rem] sm:text-xl font-medium tracking-tight text-ink-50">
              cardjoy<span className="italic text-gradient">bday</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-200">
            <Link
              href="#how-it-works"
              className="relative hover:text-ink-50 transition-colors after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-gradient-celebration hover:after:w-full after:transition-all"
            >
              How it works
            </Link>
            <Link
              href="#tech"
              className="relative hover:text-ink-50 transition-colors after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-gradient-celebration hover:after:w-full after:transition-all"
            >
              Tech
            </Link>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <ConnectButton />
            </div>
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="md:hidden p-2.5 -mr-2 rounded-xl text-ink-100 hover:bg-white/5 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[85%] max-w-sm bg-ink-900 border-l border-white/10 p-6 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <span className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-white p-0.5 ring-1 ring-white/20">
                    <img src="/logo.png" alt="cardjoy" className="w-full h-full object-contain rounded-full" />
                  </span>
                  <span className="font-display text-lg text-ink-50">
                    cardjoy<span className="italic text-gradient">bday</span>
                  </span>
                </span>
                <button
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="p-2 -mr-2 rounded-xl hover:bg-white/5"
                >
                  <X className="w-5 h-5 text-ink-100" />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                <Link
                  href="#how-it-works"
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl text-ink-50 py-3 hover:text-gradient"
                >
                  How it works
                </Link>
                <Link
                  href="#tech"
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl text-ink-50 py-3 hover:text-gradient"
                >
                  Tech
                </Link>
              </nav>

              <div className="mt-auto pt-6 border-t border-white/10">
                <p className="eyebrow mb-3">Wallet</p>
                <ConnectButton />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
