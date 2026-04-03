/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfcf8',
          100: '#f9f6ee',
          200: '#f2ead8',
        },
        sage: {
          400: '#8aab8a',
          500: '#6b8f6b',
          600: '#4f6b4f',
          700: '#3a4f3a',
        },
        terracotta: {
          400: '#d4896a',
          500: '#c4704f',
          600: '#a85c3d',
        },
        linen: '#e8dfd0',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body: ['var(--font-lato)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0,0,0,0.06)',
        'card': '0 4px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
