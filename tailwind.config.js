/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        iron: {
          950: '#111111',
          900: '#181818',
          850: '#1F1F1F',
          800: '#282828',
          700: '#363636',
          600: '#4A4945',
          500: '#6E6C65',
          400: '#9A978E',
          300: '#C4C1B8',
          200: '#E2DFD7',
          100: '#F5F3EF',
        },
        chalk: {
          DEFAULT: '#F5F3EF',
          muted: '#9A978E',
          dim: '#6E6C65',
        },
        safety: {
          DEFAULT: '#FF5500',
          hover: '#E64D00',
          dim: 'rgba(255, 85, 0, 0.14)',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
