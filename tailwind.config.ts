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
        paper: "#F4EDDE",
        manila: "#EDE3CC",
        "manila-deep": "#E0D3B4",
        oxblood: "#5E2A2B",
        "oxblood-deep": "#461E1F",
        ink: "#29251F",
        "ink-soft": "#4A4438",
        faded: "#8A7E68",
        navy: "#2F4670",
        stamp: "#A33B2E",
        brass: "#B08D3F",
        seafoam: "#4E7D6B",
        mist: "#3E6075",
        booth: "#1C1916",
      },
      fontFamily: {
        caslon: ['"Libre Caslon Text"', "Georgia", "serif"],
        type: ['"Special Elite"', '"Courier New"', "monospace"],
      },
      boxShadow: {
        strip: "0 1px 2px rgba(28,25,22,0.18), 0 8px 22px rgba(28,25,22,0.25)",
        plate: "inset 0 -3px 0 rgba(0,0,0,0.25), 0 1px 2px rgba(28,25,22,0.3)",
      },
      maxWidth: {
        app: "430px",
      },
    },
  },
  plugins: [],
};
export default config;
