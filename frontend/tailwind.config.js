/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        agri: {
          green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            600: '#2d6a4f',
            700: '#1b4332',
            800: '#143628',
            900: '#081c15',
          },
          soil: {
            100: '#f7f2ed',
            200: '#eaddcf',
            600: '#6f4e37',
            700: '#582f0e',
            800: '#3d2008',
          },
          gold: {
            100: '#fef3c7',
            400: '#f4a261',
            500: '#e09f3e',
            600: '#d4a373',
          },
          cream: {
            50: '#faf8f5',
            100: '#f4f0ea',
            200: '#e8e2d8',
          },
        },
        risk: {
          low: '#2a9d8f',
          med: '#e76f51',
          high: '#e63946',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        telugu: ['"Noto Sans Telugu"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        warm: '0 4px 20px -2px rgba(88, 47, 14, 0.08)',
        subtle: '0 2px 8px 0 rgba(27, 67, 50, 0.06)',
      },
    },
  },
  plugins: [],
};

