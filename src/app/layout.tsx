import type { Metadata } from "next";
import { Quicksand, Fredoka } from "next/font/google";
import "./globals.css";

const roundedSans = Quicksand({
  subsets: ["latin"],
  variable: "--font-rounded-sans",
  weight: ["400", "500", "600", "700"],
});

const playfulBold = Fredoka({
  subsets: ["latin"],
  variable: "--font-playful-bold",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "cardjoybday | Joyful Birthday Wishes, Built Together",
  description: "Create interactive, collaborative birthday cards powered by Sui & Walrus.",
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${roundedSans.variable} ${playfulBold.variable} font-sans bg-brand-cream text-slate-800 antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
