/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.1)',
          hover: 'rgba(255,255,255,0.1)',
        },
        surface: {
          dark: '#0f172a',
          darker: '#020617',
        },
      },
      backdropBlur: {
        xs: '2px',
        glass: '12px',
        'glass-xl': '24px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.2)',
        'glass-lg': '0 16px 48px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
