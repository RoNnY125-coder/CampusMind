import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans:  ["Plus Jakarta Sans", "sans-serif"],
        mono:  ["Fira Code", "monospace"],
        serif: ["Instrument Serif", "serif"],
      },
      colors: {
        indigo:  { DEFAULT: "#6366f1", lt: "#818cf8", dk: "#4338ca" },
        teal:    { DEFAULT: "#14b8a6", lt: "#2dd4bf" },
        rose:    { DEFAULT: "#f43f5e" },
        amber:   { DEFAULT: "#f59e0b" },
        emerald: { DEFAULT: "#10b981" },
        surface: {
          "100": "#06060a",
          "200": "#0e0e16",
          "300": "#14141f",
          "400": "#1a1a2e",
          "500": "#1f1f35",
        },
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flashGreen: {
          "0%,100%": { backgroundColor: "rgb(20 20 31)" },
          "30%":     { backgroundColor: "rgba(16,185,129,0.08)" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0.3" },
        },
        bounce: {
          "0%,80%,100%": { transform: "scale(0.7)" },
          "40%":         { transform: "scale(1)" },
        },
        drift: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%":     { transform: "translate(40px,-30px) scale(1.05)" },
        },
      },
      animation: {
        fadeUp:     "fadeUp 0.5s ease both",
        flashGreen: "flashGreen 2s ease",
        blink:      "blink 2s infinite",
        bounce:     "bounce 1.4s infinite ease-in-out",
        drift:      "drift 20s ease-in-out infinite",
      },
      borderRadius: { xl2: "1rem", xl3: "1.5rem" },
      boxShadow: {
        glow:    "0 0 40px rgba(99,102,241,0.25)",
        glowSm:  "0 0 20px rgba(99,102,241,0.15)",
        teal:    "0 8px 24px rgba(20,184,166,0.3)",
        card:    "0 4px 24px rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "brand-gradient":   "linear-gradient(135deg, #6366f1, #14b8a6)",
      },
    },
  },
  plugins: [],
};

export default config;