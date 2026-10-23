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
        navy: {
          950: '#060814',
          900: '#0b1021',
          850: '#0f172a',
          800: '#151d38',
          750: '#1b2545',
          700: '#223055',
          600: '#324577',
        },
        violet: {
          950: '#1d0c3d',
          900: '#2e1065',
          800: '#4c1d95',
          700: '#5b21b6',
          600: '#6d28d9',
          500: '#7c3aed',
          400: '#8b5cf6',
          300: '#a78bfa',
          200: '#c4b5fd',
          100: '#ddd6fe',
          50: '#f5f3ff',
        },
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ring-wave': 'ringWave 1.8s ease-out infinite',
      },
      keyframes: {
        ringWave: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '70%': { transform: 'scale(1.25)', opacity: '0' },
          '100%': { transform: 'scale(1.25)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
