/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['DM Sans', 'sans-serif']
      },
      colors: {
        dark: {
          900: '#0D1117',
          800: '#161B22',
          700: '#21262D',
          600: '#30363D'
        }
      }
    },
  },
  plugins: [],
}
