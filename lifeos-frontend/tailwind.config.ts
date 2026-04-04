import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core surfaces — matches the dark theme from the prototype
        bg:        '#0f0f0f',
        surface:   '#1a1a1a',
        surface2:  '#242424',
        border:    '#2e2e2e',
        // Text
        primary:   '#f0f0f0',
        muted:     '#888888',
        // Brand accent — from PWA manifest theme_color
        accent:    '#0F6E56',
        'accent-light': '#17A37A',
        // Status colours
        green:  '#6fcf6f',
        amber:  '#c4a05a',
        red:    '#e05555',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
          'sans-serif',
        ],
      },
      maxWidth: {
        app: '420px',
      },
      height: {
        nav: '64px',
      },
      screens: {
        // Only one breakpoint needed — everything is mobile-first at ≤420px
        sm: '420px',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
