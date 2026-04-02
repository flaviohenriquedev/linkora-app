import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
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
          "33%": { transform: "translate(20px, -26px) scale(1.06)" },
          "66%": { transform: "translate(-16px, 18px) scale(0.94)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-42px, 32px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.72", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 50%" },
          "100%": { backgroundPosition: "-200% 50%" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease forwards",
        float: "float 11s ease-in-out infinite",
        "float-slow": "float 15s ease-in-out infinite",
        drift: "drift 13s ease-in-out infinite",
        "drift-reverse": "drift 16s ease-in-out infinite reverse",
        "pulse-soft": "pulse-soft 3.5s ease-in-out infinite",
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
