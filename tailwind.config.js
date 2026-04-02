/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'monospace'],
        'heading': ['Orbitron', 'JetBrains Mono', 'monospace'],
        'mono': ['JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'monospace'],
      },
      colors: {
        primary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        accent: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        neon: {
          cyan: '#00D4FF',
          gold: '#F59E0B',
          purple: '#8B5CF6',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.08)',
          DEFAULT: 'rgba(255, 255, 255, 0.03)',
          dark: 'rgba(255, 255, 255, 0.01)',
        },
        void: {
          DEFAULT: '#0a0a0f',
          card: '#12121a',
          elevated: '#1a1a28',
          muted: '#272f42',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0a0a0f, #0d0d1a, #0f0a1a)',
        'gradient-accent': 'linear-gradient(90deg, #F59E0B, #D97706, #8B5CF6)',
        'gradient-modern': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        'gradient-aurora': 'linear-gradient(135deg, #F59E0B 0%, #8B5CF6 50%, #00D4FF 100%)',
        'gradient-cosmic': 'linear-gradient(135deg, #8B5CF6 0%, #F59E0B 50%, #00D4FF 100%)',
        'gradient-crypto': 'linear-gradient(135deg, #F59E0B 0%, #8B5CF6 100%)',
      },
      boxShadow: {
        'card': '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        'hover': '0 20px 60px rgba(245, 158, 11, 0.08)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-lg': '0 0 40px rgba(245, 158, 11, 0.15)',
        'glow-cyan': '0 0 30px rgba(245, 158, 11, 0.25), 0 0 60px rgba(245, 158, 11, 0.1)',
        'glow-teal': '0 0 30px rgba(139, 92, 246, 0.25), 0 0 60px rgba(139, 92, 246, 0.1)',
        'glow-gold': '0 0 30px rgba(245, 158, 11, 0.25), 0 0 60px rgba(245, 158, 11, 0.1)',
        'glow-purple': '0 0 30px rgba(139, 92, 246, 0.25), 0 0 60px rgba(139, 92, 246, 0.1)',
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.4)',
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
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'md': '0 2px 4px rgba(0, 0, 0, 0.5)',
        'lg': '0 4px 8px rgba(0, 0, 0, 0.6)',
        'glow': '0 0 10px rgba(245, 158, 11, 0.8)',
        'glow-purple': '0 0 10px rgba(139, 92, 246, 0.8)',
        'glow-cyan': '0 0 10px rgba(0, 212, 255, 0.8)',
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
