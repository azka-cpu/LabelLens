/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0E1A',
        surface: '#121826',
        surface2: '#1B2436',
        line: 'rgba(148,163,184,0.12)',
        ink: '#E7ECF5',
        muted: '#8891A6',
        laser: '#FF4757',
        mint: '#2DD8B8',
        amber: '#F5A623',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,71,87,0.35), 0 0 24px rgba(255,71,87,0.25)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-4%)' },
          '50%': { transform: 'translateY(104%)' },
          '100%': { transform: 'translateY(-4%)' },
        },
      },
      animation: {
        scan: 'scan 2.6s cubic-bezier(0.65,0,0.35,1) infinite',
      },
    },
  },
  plugins: [],
}
