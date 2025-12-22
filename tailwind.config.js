// Tailwind config tuned for elder-friendly UI
module.exports = {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './plugins/**/*.{js,ts}',
    './app/**/*.{vue,js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        orchardGreen: '#6BBF59',
        gentleOrange: '#FFB347',
        softBeige: '#FFF7EC',
        deepBrown: '#4A2C2A'
      },
      fontSize: {
        base: '18px',
        lg: '20px',
        xl: '22px',
        '2xl': '26px'
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px'
      },
      boxShadow: {
        soft: '0 8px 20px rgba(0,0,0,0.06)'
      }
    }
  },
  plugins: []
}

