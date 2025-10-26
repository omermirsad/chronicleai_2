/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
      colors: {
        background: 'rgb(250, 250, 249)', // stone-50
        foreground: 'rgb(41, 37, 36)', // stone-800
        border: 'rgb(231, 229, 228)', // stone-200
      },
    },
  },
  plugins: [],
}
