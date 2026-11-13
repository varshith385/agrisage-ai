/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#183D2E', // Deep green #183D2E
          greenDark: '#0E241B',
          greenLight: '#265C46',
          amber: '#DA9A4C', // Amber #DA9A4C
          amberLight: '#F5C989',
          amberDark: '#B87B2E',
          brown: '#7A553A', // Brown #7A553A
          brownLight: '#A37754',
          brownDark: '#543924',
          cream: '#FAF8F5', // Off-white #FAF8F5
          creamDark: '#F0EBE1',
          textDark: '#1A2421',
          textMuted: '#4E5F57',
        },
        agri: {
          green: {
            50: '#FAF8F5',
            100: '#E4EDE8',
            600: '#235943',
            700: '#183D2E', // Deep green #183D2E
            800: '#133226',
            900: '#0F271E',
            950: '#081711',
          },
          soil: {
            100: '#FAF8F5',
            200: '#EFE7DE',
            600: '#7A553A', // Brown #7A553A
            700: '#63442E',
            800: '#4A3322',
          },
          gold: {
            100: '#FEF6E9',
            400: '#E5AF68',
            500: '#DA9A4C', // Amber #DA9A4C
            600: '#C28334',
          },
          cream: {
            50: '#FAF8F5', // Off-white #FAF8F5
            100: '#F4EFE6',
            200: '#E7DFD5',
            300: '#D5C9BA',
          },
        },
        risk: {
          low: '#1B6A4C',
          med: '#DA9A4C',
          high: '#C0392B',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        telugu: ['"Noto Sans Telugu"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        warm: '0 4px 20px -2px rgba(122, 85, 58, 0.12)',
        subtle: '0 2px 8px 0 rgba(24, 61, 46, 0.08)',
        card: '0 1px 3px 0 rgba(24, 61, 46, 0.06), 0 1px 2px -1px rgba(24, 61, 46, 0.06)',
        elevated: '0 10px 25px -5px rgba(24, 61, 46, 0.12), 0 8px 10px -6px rgba(24, 61, 46, 0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
