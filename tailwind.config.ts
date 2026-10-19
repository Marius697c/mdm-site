import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef3fb",
          100: "#d9e4f5",
          200: "#b3c8ea",
          300: "#7f9fd0",
          400: "#4a73b3",
          500: "#2a5090",
          600: "#1c3d78",
          700: "#122e5f",
          800: "#0c2149",
          900: "#081a3b",
          950: "#050f26",
        },
        cyan: {
          300: "#7be4f2",
          400: "#3fd0e6",
          500: "#14b8d4",
        },
      },
      fontFamily: {
        sans: ["'Manrope Variable'", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(8, 26, 59, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
