/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#cc785c",
          active: "#a9583e",
          disabled: "#e6dfd8"
        },
        ink: "#141413",
        body: {
          DEFAULT: "#3d3d3a",
          strong: "#252523"
        },
        muted: {
          DEFAULT: "#6c6a64",
          soft: "#8e8b82"
        },
        hairline: {
          DEFAULT: "#e6dfd8",
          soft: "#ebe6df"
        },
        canvas: "#faf9f5",
        surface: {
          soft: "#f5f0e8",
          card: "#efe9de",
          creamStrong: "#e8e0d2",
          dark: "#181715",
          darkElevated: "#252320",
          darkSoft: "#1f1e1b"
        },
        onPrimary: "#ffffff",
        onDark: {
          DEFAULT: "#faf9f5",
          soft: "#a09d96"
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Cascadia Code',
          'ui-monospace',
          'Consolas',
          'monospace',
        ],
      }
    },
  },
  plugins: [],
}
