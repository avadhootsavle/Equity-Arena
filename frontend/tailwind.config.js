/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0D1117',
          800: '#161B22',
          700: '#21262D',
          600: '#30363D'
        },
        brand: {
          amber: '#F0B429',
          amberDark: '#D4970A'
        },
        gain: '#3FB950',
        loss: '#F85149'
      }
    },
  },
  plugins: [],
}
