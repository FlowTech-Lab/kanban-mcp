/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ny: {
          bg: 'var(--ny-bg)',
          surface: 'var(--ny-surface)',
          'surface-elevated': 'var(--ny-surface-elevated)',
          border: 'var(--ny-border)',
          text: 'var(--ny-text)',
          'text-muted': 'var(--ny-text-muted)',
          accent: 'var(--ny-accent)',
          'accent-hover': 'var(--ny-accent-hover)',
          'accent-muted': 'var(--ny-accent-muted)',
        },
        glass: {
          bg: 'rgba(255,255,255,0.04)',
          border: 'rgba(255,255,255,0.08)',
          hover: 'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        editorial: ['Crimson Pro', 'Georgia', 'Times New Roman', 'serif'],
      },
      backdropBlur: {
        xs: '2px',
        glass: '12px',
        'glass-xl': '24px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.3)',
        'glass-lg': '0 16px 48px rgba(0,0,0,0.4)',
      },
      minWidth: {
        column: '260px',
      },
      screens: {
        board: '640px',
      },
    },
  },
  plugins: [],
};
