import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "dark-blue": {
          900: "#0d0d2b",
          800: "#0d2040",
          700: colors.sky[900]
        },
        sky: colors.sky
      },
      typography: {
        DEFAULT: {
          css: {
            blockquote: {
              fontWeight: 400
            },
            a: {
              color: colors.sky[400],
              "&:hover": {
                color: colors.sky[300]
              },
              textDecoration: "none"
            }
          }
        }
      }
    }
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")]
};
export default config;
