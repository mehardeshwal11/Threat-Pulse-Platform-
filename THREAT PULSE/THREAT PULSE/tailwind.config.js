/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#05070a',
          900: '#0a0d14',
          850: '#0f1420',
          800: '#151b2b',
          700: '#232d44',
          border: '#1f293d',
          gold: '#eab308',
          yellow: '#facc15',
          amber: '#f59e0b',
          cyan: '#06b6d4',
          red: '#ef4444',
          orange: '#f97316',
          green: '#22c55e'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'sweep 4s linear infinite',
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
};
