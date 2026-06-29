// tailwind.config.js
import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {},
  },

  plugins: [daisyui],

  daisyui: {
    themes: [
      {
        thornview: {
          primary: "#5B8CFF",
          secondary: "#9B7BFF",
          accent: "#22C55E",
          neutral: "#111827",

          "base-100": "#0B0F19",
          "base-200": "#0F172A",
          "base-300": "#111C33",

          info: "#38BDF8",
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
      "light",
    ],
  },
};