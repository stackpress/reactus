/** @type {import('tailwindcss').Config} */
console.log('Tailwind config loaded');
module.exports = {
  safelist: ['text-reactus'],
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    '../with-plugin/components/**/*.{js,ts,jsx,tsx}',
    '../with-plugin/pages/**/*.{js,ts,jsx,tsx}',
    '../../node_modules/reactus-with-plugin/components/**/*.{js,ts,jsx,tsx}',
    '../../node_modules/reactus-with-plugin/pages/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        reactus: 'blue',
      },
    },
  },
  plugins: [],
};