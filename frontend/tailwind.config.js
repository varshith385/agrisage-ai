/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1B5E3B', // Deep field green #1B5E3B
          greenDark: '#0F3B24',
          greenLight: '#267A4E',
          amber: '#F2B01E', // Amber #F2B01E (always with dark text)
          amberLight: '#FCE7B2',
          amberDark: '#9E5B00',
          brown: '#7A553A', // Soil brown #7A553A
          cream: '#FFFDF8', // Warm off-white #FFFDF8
          creamDark: '#F7F3EA',
          textDark: '#1F2A24', // Near-black #1F2A24
          textMuted: '#4A5750', // Secondary text #4A5750
          water: '#1565A8', // Water blue #1565A8
          cardBorder: '#D9D4C7', // Clear 1px card border
        },
        agri: {
          green: {
            50: '#FFFDF8',
            100: '#E8F5E9',
            600: '#237349',
            700: '#1B5E3B', // Deep field green #1B5E3B
            800: '#154E30',
            900: '#0F3B24',
            950: '#082516',
          },
          soil: {
            100: '#FFFDF8',
            200: '#F5ECE2',
            600: '#7A553A', // Brown #7A553A
            700: '#63442E',
            800: '#4A3322',
          },
          gold: {
            100: '#FFF8E1',
            400: '#F7C65A',
            500: '#F2B01E', // Amber #F2B01E
            600: '#D4940E',
          },
          water: {
            100: '#E3F2FD',
            500: '#1565A8', // Blue #1565A8
            700: '#0D47A1',
          },
          cream: {
            50: '#FFFDF8', // Warm off-white #FFFDF8
            100: '#F9F6EE',
            200: '#EFEAE0',
            300: '#D9D4C7',
          },
        },
        status: {
          success: '#2E7D32',
          warning: '#9E5B00',
          danger: '#B3261E',
          info: '#1565A8',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        telugu: ['"Noto Sans Telugu"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        warm: '0 4px 20px -2px rgba(122, 85, 58, 0.08)',
        subtle: '0 2px 8px 0 rgba(27, 94, 59, 0.06)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        elevated: '0 10px 25px -5px rgba(27, 94, 59, 0.10), 0 8px 10px -6px rgba(27, 94, 59, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
