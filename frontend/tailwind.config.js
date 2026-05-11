/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ceis: {
          primary: "#1e40af",
          accent: "#0ea5e9",
          dark: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
