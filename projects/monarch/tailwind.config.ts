import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "whale-dark": "#0B132B",
        "whale-lime": "#C7F284",
        "whale-gray": {
          100: "#1A2332",
          200: "#2A3441",
          300: "#3A4450",
          400: "#4A545F",
          500: "#5A646E",
          600: "#6A747D",
          700: "#7A848C",
          800: "#8A949B",
          900: "#9AA4AA"
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))"
      }
    }
  },
  plugins: []
}
export default config
