import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f5f0e8",
          100: "#e7dfd2",
          200: "#c9bfae",
          300: "#a8a39c",
          400: "#7a766f",
          500: "#52504b",
          600: "#363430",
          700: "#1f1d23",
          800: "#110f17",
          900: "#0b0910",
          950: "#08070d",
        },
        ember: {
          DEFAULT: "#FF6B5C",
          dim: "#c54f43",
          glow: "#FFB3A8",
        },
        rosegold: {
          DEFAULT: "#FF4D8D",
          dim: "#b73969",
        },
        iris: {
          DEFAULT: "#9B6FFF",
          dim: "#6c4ab8",
        },
        sungold: {
          DEFAULT: "#F5C572",
          dim: "#b58a3e",
        },
        // Backward-compat brand aliases mapped to new dark palette
        brand: {
          pink: "#FF4D8D",
          blue: "#9B6FFF",
          teal: "#4ADE80",
          orange: "#F5C572",
          cream: "#08070d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "ui-serif", "Georgia"],
        mono: ["var(--font-mono)", "ui-monospace"],
        heading: ["var(--font-display)", "ui-serif", "Georgia"],
      },
      backgroundImage: {
        "gradient-celebration":
          "linear-gradient(135deg, #FF6B5C 0%, #FF4D8D 50%, #9B6FFF 100%)",
        "gradient-ember": "linear-gradient(135deg, #FF6B5C 0%, #FF4D8D 100%)",
        "gradient-iris": "linear-gradient(135deg, #FF4D8D 0%, #9B6FFF 100%)",
        "gradient-warm": "linear-gradient(135deg, #F5C572 0%, #FF6B5C 100%)",
      },
      boxShadow: {
        "glow-ember": "0 20px 60px -20px rgba(255, 107, 92, 0.5)",
        "glow-rose": "0 20px 60px -20px rgba(255, 77, 141, 0.5)",
        "glow-iris": "0 20px 60px -20px rgba(155, 111, 255, 0.5)",
        "soft-card": "0 1px 0 rgba(255,255,255,0.06) inset, 0 30px 80px -30px rgba(0,0,0,0.6)",
      },
      animation: {
        "float-slow": "float 9s ease-in-out infinite",
        "float-slower": "float 14s ease-in-out infinite",
        "aurora-drift": "aurora-drift 25s ease-in-out infinite",
        "shimmer": "shimmer 4s linear infinite",
        "flame-flicker": "flame-flicker 0.6s ease-in-out infinite alternate",
        "marquee": "marquee 35s linear infinite",
        "rise": "rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-18px) translateX(6px)" },
        },
        "aurora-drift": {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(5%, 8%) scale(1.08)" },
          "66%": { transform: "translate(-4%, -4%) scale(0.95)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        "flame-flicker": {
          "0%": { transform: "scale(1) translateY(0)", opacity: "0.95" },
          "100%": { transform: "scale(1.08) translateY(-1px)", opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
