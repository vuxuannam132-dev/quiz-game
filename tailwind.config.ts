import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bảng màu mới: Trắng + Đỏ + Xanh (Kahoot style)
        'brand-red': '#E21B3C',
        'brand-blue': '#1368CE',
        'brand-yellow': '#FFA602',
        'brand-green': '#26890C',
        'brand-dark': '#0F172A',
        'brand-bg': '#F8FAFC',
        
        // 4 khối đáp án kiểu Kahoot
        'kahoot-red': '#E21B3C',
        'kahoot-blue': '#1368CE',
        'kahoot-yellow': '#D89E00',
        'kahoot-green': '#26890C',
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'liquid-shine': 'liquidShine 3s ease-in-out infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-8px)' },
          '40%, 80%': { transform: 'translateX(8px)' },
        },
        pulseSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        liquidShine: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      boxShadow: {
        'liquid': '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
        'liquid-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
        'button-3d': '0 6px 0 0 rgba(0, 0, 0, 0.15)',
        'button-3d-active': '0 2px 0 0 rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}

export default config
