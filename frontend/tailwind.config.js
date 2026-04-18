/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Green - Brand Theme (#5B7E3C)
        primary: {
          50: '#f7faf3',
          100: '#e8f5bd',
          200: '#d4e8a3',
          300: '#b8d685',
          400: '#a2cb8b',
          500: '#7da556',
          600: '#5b7e3c',  // Main Brand Color
          700: '#4a6830',
          800: '#3d5528',
          900: '#2d3f1d',
        },
        // Action Red - For Buttons & CTAs (#C44545)
        action: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#c44545',
          500: '#c44545',  // Main Action Color - Brand Red
          600: '#b33a3a',
          700: '#963030',
          800: '#7a2727',
          900: '#642020',
        },
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(10, 38, 71, 0.15)',
        'premium-lg': '0 20px 60px -15px rgba(10, 38, 71, 0.2)',
      },
    },
  },
  plugins: [],
}
