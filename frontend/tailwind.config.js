/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0a3d5c',
        secondary: '#1e90ff',
        accent: '#00b894',
      },
    },
  },
  plugins: [],
}

