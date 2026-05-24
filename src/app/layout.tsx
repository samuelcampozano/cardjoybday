import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "cardjoybday — Birthday wishes, forever on-chain",
  description:
    "Collaborative AI birthday cards stored permanently on Sui & Walrus.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${fraunces.variable} ${jakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans bg-ink-950 text-ink-50 antialiased min-h-screen">
        <div className="aurora-bg" aria-hidden />
        <div className="noise-overlay" aria-hidden />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
