import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ds: {
          bg: "var(--ds-color-surface-base)",
          text: "var(--ds-color-text-primary)",
          muted: "var(--ds-color-text-secondary)",
          brand: "var(--ds-color-brand-primary)",
          brandStrong: "var(--ds-color-brand-primaryStrong)",
          link: "var(--ds-color-brand-link)"
        }
      },
      borderRadius: {
        dsSm: "var(--ds-radius-sm)",
        dsMd: "var(--ds-radius-md)",
        dsLg: "var(--ds-radius-lg)",
        dsXl: "var(--ds-radius-xl)",
        dsPill: "var(--ds-radius-pill)"
      },
      boxShadow: {
        dsSoft: "var(--ds-shadow-soft)",
        dsGlass: "var(--ds-shadow-glass)",
        dsBrand: "var(--ds-shadow-brand)"
      },
      fontFamily: {
        ds: ["var(--ds-font-family)"]
      }
    }
  },
  plugins: []
};

export default config;
