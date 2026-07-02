import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        mint: "#2f9e83",
        coral: "#f06f5f",
        cloud: "#f6f8fb",
        line: "#dbe2ea",
      },
    },
  },
  plugins: [],
};

export default config;
