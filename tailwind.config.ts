import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F2ECDD",
        "cream-deep": "#E6DCC4",
        paper: "#F9F4E9",
        navy: "#1F3A5F",
        "navy-deep": "#14243A",
        ink: "#22262B",
        "ink-soft": "#4A4F57",
        faded: "#8A7F6A",
        gold: "#C9A86A",
        signal: "#B33A3A",
        booth: "#10151D",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        geo: ["Jost", '"Avenir Next"', "Futura", "sans-serif"],
      },
      boxShadow: {
        strip: "0 1px 2px rgba(20,36,58,0.16), 0 8px 22px rgba(20,36,58,0.22)",
        plate: "inset 0 -3px 0 rgba(0,0,0,0.25), 0 1px 2px rgba(20,36,58,0.3)",
      },
      maxWidth: {
        app: "430px",
      },
    },
  },
  plugins: [],
};
export default config;
