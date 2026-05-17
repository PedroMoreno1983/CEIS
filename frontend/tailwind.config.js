/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ceis: {
          primary: "#2563eb",
          accent: "#3b82f6",
          dark: "#1e293b",
        },
      },
    },
  },
  plugins: [],
};
