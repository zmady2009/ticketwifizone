import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs opérateurs Mobile Money
        orange: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
          400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
          800: '#9a3412', 900: '#7c2d12', 950: '#431407',
        },
        // Couleurs marque TicketWiFiZone
        // Primaire: #123B8B (bleu), Accent: #81B545 (vert)
        brand: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c3d9ff',
          300: '#9cc3ff',
          400: '#6ea7ff',
          500: '#4b8cf2',
          DEFAULT: '#123B8B',
          600: '#123B8B',
          700: '#0e2a66',
          800: '#0a1d44',
          900: '#061122',
          950: '#030811',
        },
        accent: {
          DEFAULT: '#81B545',
          50: '#f4f9ed',
          100: '#e8f3db',
          200: '#d0e7b7',
          300: '#a8d48a',
          400: '#81B545',
          500: '#6b9637',
          600: '#55782c',
          700: '#405a21',
          800: '#2c3d16',
          900: '#1a200d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
