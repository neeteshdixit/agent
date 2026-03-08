/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#10a37f',
          600: '#0d8d6e',
          700: '#0b6f57',
        },
      },
      boxShadow: {
        panel: '0 12px 30px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
};
