/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        earth: {
          900: '#0c0f0d',
          800: '#141a16',
          700: '#1c2620',
          600: '#2b3b32',
          500: '#3d5246',
        },
        agri: {
          green: '#10b981',
          emerald: '#059669',
          gold: '#eab308',
          amber: '#f59e0b',
          blue: '#0ea5e9',
          cyan: '#06b6d4',
          dark: '#080a09'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Merriweather', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
