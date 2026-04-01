import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        black: "#000000",
        white: "#ffffff",
        gray: {
          950: "#030303",
          900: "#0a0a0a",
          800: "#111111",
          700: "#1a1a1a",
          600: "#222222",
          500: "#333333",
          400: "#555555",
          300: "#888888",
          200: "#aaaaaa",
          100: "#cccccc",
        },
        blue: {
          600: "#2563eb",
          500: "#3b82f6",
          400: "#60a5fa",
          300: "#93c5fd",
        },
        cyan: {
          500: "#06b6d4",
          400: "#22d3ee",
        },
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bounceDot: {
          "0%,80%,100%": { transform: "scale(0.7)", opacity: "0.5" },
          "40%": { transform: "scale(1.1)", opacity: "1" },
        },
        flashBlue: {
          "0%,100%": { backgroundColor: "#111111" },
          "30%": { backgroundColor: "rgba(37,99,235,0.15)" },
        },
        drift: {
          "0%,100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(30px,-20px)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.4s ease both",
        bounceDot: "bounceDot 1.4s infinite ease-in-out",
        flashBlue: "flashBlue 2s ease",
        drift: "drift 20s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-blue": "linear-gradient(135deg, #2563eb, #06b6d4)",
        "gradient-dark": "linear-gradient(135deg, #111111, #1a1a1a)",
      },
      boxShadow: {
        "glow-blue": "0 0 30px rgba(37,99,235,0.2)",
        "glow-blue-lg": "0 0 60px rgba(37,99,235,0.3)",
        card: "0 4px 24px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;