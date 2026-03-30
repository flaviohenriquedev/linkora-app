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
        bg: {
          primary: "#0D1F17",
          secondary: "#152B1F",
          card: "#1A3526",
        },
        border: { DEFAULT: "#2E5040" },
        green: {
          main: "#2E7D52",
          light: "#4CAF76",
        },
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8C96A",
        },
        text: {
          primary: "#F5F2EC",
          secondary: "#8FAF9A",
          muted: "#456055",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(8px, -12px) scale(1.02)" },
          "66%": { transform: "translate(-6px, 6px) scale(0.98)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-20px, 14px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.85", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.03)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 50%" },
          "100%": { backgroundPosition: "-200% 50%" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease forwards",
        float: "float 18s ease-in-out infinite",
        "float-slow": "float 26s ease-in-out infinite",
        drift: "drift 22s ease-in-out infinite",
        "drift-reverse": "drift 28s ease-in-out infinite reverse",
        "pulse-soft": "pulse-soft 6s ease-in-out infinite",
        shimmer: "shimmer 8s ease infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
