/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#7C3AED',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        error: '#EF4444',
        'dark-bg': '#1F2937',
        'dark-surface': '#374151'
      }
    }
  },
  plugins: []
} 