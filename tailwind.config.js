/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'heading': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['SF Mono', 'ui-monospace', 'Cascadia Code', 'Roboto Mono', 'monospace'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        neon: {
          cyan: '#06b6d4',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.06)',
          DEFAULT: 'rgba(255, 255, 255, 0.03)',
          dark: 'rgba(255, 255, 255, 0.01)',
        },
        void: {
          DEFAULT: '#09090b',
          card: '#18181b',
          elevated: '#27272a',
          muted: '#3f3f46',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #09090b, #18181b)',
        'gradient-modern': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'hover': '0 4px 12px rgba(0, 0, 0, 0.3)',
        'glass': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'glow': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'glow-gold': '0 1px 3px rgba(0, 0, 0, 0.3)',
        '3xl': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce-gentle 2s infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bounce-gentle': {
          '0%, 100%': { 
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' 
          },
          '50%': { 
            transform: 'translateY(-5px)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' 
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      textShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.2)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      borderWidth: {
        '3': '3px',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
      }
    },
  },
  plugins: [
    require('tailwindcss-textshadow'),
    function({ addUtilities }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(40px)',
          '-webkit-backdrop-filter': 'blur(40px)',
          border: '0.5px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        },
        '.glass-hover:hover': {
          background: 'rgba(255, 255, 255, 0.06)',
        },
        '.liquid-glass': {
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(60px) saturate(1.8)',
          '-webkit-backdrop-filter': 'blur(60px) saturate(1.8)',
          border: '0.5px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 rgba(255, 255, 255, 0.02)',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': 'rgba(255, 255, 255, 0.2) transparent',
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '3px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(255, 255, 255, 0.3)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
