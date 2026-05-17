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
        brand: {
          cream: "#FCF9F1",
          teal: "#2DD4BF",
          blue: "#3B82F6",
          pink: "#EC4899",
          orange: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["var(--font-rounded-sans)", "ui-sans-serif", "system-ui"],
        heading: ["var(--font-playful-bold)", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
export default config;
