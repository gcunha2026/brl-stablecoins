import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0F1117",
        card: "#1E1E2E",
        "card-border": "#2D2D3D",
        "card-hover": "#252538",
        "accent-teal": "#00D4AA",
        "accent-cyan": "#00B4D8",
        "accent-purple": "#7C3AED",
        "accent-pink": "#EC4899",
        "accent-blue": "#3B82F6",
        "accent-orange": "#F59E0B",
        "text-primary": "#E4E4E7",
        "text-secondary": "#9CA3AF",
        "text-muted": "#6B7280",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
      backgroundImage: {
        "gradient-teal": "linear-gradient(135deg, #00D4AA, #00B4D8)",
        "gradient-purple": "linear-gradient(135deg, #7C3AED, #EC4899)",
        "gradient-blue": "linear-gradient(135deg, #3B82F6, #00B4D8)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
