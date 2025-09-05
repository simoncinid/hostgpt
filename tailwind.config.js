/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF5A5F',
        secondary: '#FF385C',
        accent: '#E61E4D',
        dark: '#222222',
        gray: {
          100: '#F7F7F7',
          200: '#EBEBEB',
          300: '#DDDDDD',
          400: '#B0B0B0',
          500: '#717171',
          600: '#484848',
        }
      },
      fontFamily: {
        sans: ['ApfelGrotezk', 'Circular', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
