/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        slate: {
          950: '#070A11', // Deep Midnight Obsidian background
          900: '#0D131F', // Rich Charcoal Card Surface
          850: '#121A2B', // Elevated Sub-surface
          800: '#172237', // Fine Borders / subtle input wells
          700: '#233352', // Active borders / muted icons
          600: '#3A4D73',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Crisp emerald primary
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        surface: {
          light: '#f8fafc',
          dark: '#070A11',
          cardLight: '#ffffff',
          cardDark: '#0D131F',
          borderLight: '#e2e8f0',
          borderDark: 'rgba(255, 255, 255, 0.08)'
        }
      }
    },
  },
  plugins: [],
}
