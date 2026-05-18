/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        ink: {
          50: '#f7f8fa',
          100: '#eef0f4',
          200: '#dde1e9',
          300: '#c0c6d2',
          400: '#8a91a1',
          500: '#5b6273',
          600: '#3f4555',
          700: '#2a2f3c',
          800: '#1a1e28',
          900: '#0f1218',
        },
        accent: {
          DEFAULT: '#7c5e3c',
          soft: '#a98a64',
          dark: '#5a4329',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,18,24,0.04), 0 1px 3px rgba(15,18,24,0.06)',
        pop: '0 8px 24px rgba(15,18,24,0.10), 0 2px 6px rgba(15,18,24,0.06)',
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
};
