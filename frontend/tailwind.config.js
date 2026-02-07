/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Coup game theme colors
        'coup-red': '#c41e3a',
        'coup-gold': '#d4af37',
        'coup-dark': '#1a1a2e',
        'coup-darker': '#0f0f1e',
        // Auth / app theme palette
        slate: '#294a5b',    // Background (deep slate)
        panel: '#5c7c94',    // Panels/sections (desaturated teal)
        accent: '#e63946',   // Accent/highlight (lively coral red)
        light: '#ff9f68',   // Light accents/text (warm coral orange)
        contrast: '#2c3c44', // Deep text/contrast (very dark blue-gray)
      },
      animation: {
        'card-flip': 'flip 0.6s ease-in-out',
        'card-slide': 'slide 0.3s ease-out',
        'coin-toss': 'toss 0.8s ease-in-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        slide: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        toss: {
          '0%, 100%': { transform: 'translateY(0) rotateZ(0deg)' },
          '50%': { transform: 'translateY(-20px) rotateZ(180deg)' },
        },
      },
    },
  },
  plugins: [],
}
