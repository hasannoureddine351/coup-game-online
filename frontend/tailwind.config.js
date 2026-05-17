/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk terminal palette
        'cyber-bg':     '#0d0e12',
        'cyber-panel':  '#181a21',
        'cyber-border': '#2a2d3a',
        'neon-cyan':    '#00f0ff',
        'neon-red':     '#ff0055',
        'neon-yellow':  '#ffdd00',
        'neon-purple':  '#b600ff',
        'neon-green':   '#00ff41',
        'neon-pink':    '#ff006e',
        // Legacy coup colors kept for compatibility
        'coup-red':     '#c41e3a',
        'coup-gold':    '#d4af37',
        'coup-dark':    '#181a21',
        'coup-darker':  '#0d0e12',
        // Auth / app theme palette (kept for auth pages)
        slate:    '#294a5b',
        panel:    '#5c7c94',
        accent:   '#e63946',
        light:    '#ff9f68',
        contrast: '#2c3c44',
      },
      fontFamily: {
        'pixel':   ['"Press Start 2P"', 'monospace'],
        'vt':      ['"VT323"', 'monospace'],
        'mono':    ['"Share Tech Mono"', '"Courier New"', 'monospace'],
        'gothic':  ['"Cloister Black"', 'serif'],
      },
      boxShadow: {
        'neon-cyan':   '0 0 8px #00f0ff, 0 0 20px rgba(0,240,255,0.4)',
        'neon-red':    '0 0 8px #ff0055, 0 0 20px rgba(255,0,85,0.4)',
        'neon-yellow': '0 0 8px #ffdd00, 0 0 20px rgba(255,221,0,0.4)',
        'neon-purple': '0 0 8px #b600ff, 0 0 20px rgba(182,0,255,0.4)',
        'neon-green':  '0 0 8px #00ff41, 0 0 20px rgba(0,255,65,0.4)',
        'pixel':       '4px 4px 0px #000',
        'pixel-cyan':  '4px 4px 0px rgba(0,240,255,0.5)',
        'pixel-red':   '4px 4px 0px rgba(255,0,85,0.5)',
      },
      animation: {
        'scanline':    'scanline 8s linear infinite',
        'flicker':     'flicker 0.15s infinite',
        'blink':       'blink 1s step-end infinite',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'card-flip':   'flip 0.6s ease-in-out',
        'card-slide':  'slide 0.3s ease-out',
        'coin-toss':   'toss 0.8s ease-in-out',
        'type-in':     'typeIn 0.5s steps(20) forwards',
      },
      keyframes: {
        scanline: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.97' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%':      { opacity: '0.85', filter: 'brightness(1.3)' },
        },
        flip: {
          '0%':   { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        slide: {
          '0%':   { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        toss: {
          '0%, 100%': { transform: 'translateY(0) rotateZ(0deg)' },
          '50%':      { transform: 'translateY(-20px) rotateZ(180deg)' },
        },
        typeIn: {
          from: { width: '0' },
          to:   { width: '100%' },
        },
      },
    },
  },
  plugins: [],
}
