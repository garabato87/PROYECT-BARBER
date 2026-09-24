/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        secondary: "var(--bg-secondary)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        foreground: "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          glow: "var(--accent-glow)"
        },
        border: "var(--border)",
        "glass-border": "var(--glass-border)",
        danger: "var(--danger)",
        success: "var(--success)",
        "on-primary": "var(--on-primary)",
        "action-border": "var(--action-border)",
        "focus-ring": "var(--focus-ring)",
        "border-subtle": "var(--border-subtle)",
        "border-control": "var(--border-control)",
        "danger-bg": "var(--danger-bg)",
        "success-bg": "var(--success-bg)",
        warning: "var(--warning)",
        "warning-bg": "var(--warning-bg)",
      },
      borderRadius: {
        sm: "var(--border-radius-sm)",
        md: "var(--border-radius-md)",
        lg: "var(--border-radius-lg)",
        full: "var(--border-radius-full)",
      },
      fontFamily: {
        sans: ["var(--font-main)"],
        heading: ["var(--font-heading)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
      },
      transitionTimingFunction: {
        DEFAULT: "var(--transition-timing)",
      },
      transitionDuration: {
        DEFAULT: "var(--transition-speed)",
      }
    },
  },
  plugins: [],
}
