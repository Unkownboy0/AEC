/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /* ─── Font Family ────────────────────────────────────── */
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          '"Fira Sans"',
          '"Droid Sans"',
          '"Helvetica Neue"',
          "sans-serif",
        ],
      },

      /* ─── Font Size Scale (per master spec) ──────────────── */
      fontSize: {
        // Display: 44-56px desktop / 32-40px mobile
        "display-lg": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display": ["2.75rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-sm": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "700" }],
        // Page Title: 30-38px desktop / 24-30px mobile
        "page-title": ["1.875rem", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
        "page-title-sm": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        // Section Title: 20-24px
        "section-title": ["1.25rem", { lineHeight: "1.35", letterSpacing: "-0.01em", fontWeight: "600" }],
        // Card Title: 15-17px
        "card-title": ["0.9375rem", { lineHeight: "1.4", fontWeight: "600" }],
        // Body: 14-16px
        "body-lg": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body": ["0.875rem", { lineHeight: "1.6", fontWeight: "400" }],
        // Caption: 12-13px
        "caption": ["0.8125rem", { lineHeight: "1.4", fontWeight: "500" }],
        "caption-sm": ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
      },

      /* Colors (HSL var references for Tailwind) */
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        "app-bg": "hsl(var(--app-bg))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          soft: "hsl(var(--surface-soft))",
          raised: "hsl(var(--surface-raised))",
          foreground: "hsl(var(--surface-foreground))",
        },
        raised: "hsl(var(--raised))",
        sidebar: "hsl(var(--sidebar-bg))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          soft: "hsl(var(--primary-soft))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Text Hierarchy */
        "text-primary": "hsl(var(--text-primary))",
        "text-secondary": "hsl(var(--text-secondary))",
        "text-muted": "hsl(var(--text-muted))",
        /* Status Colors */
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          light: "hsl(var(--success-light))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          light: "hsl(var(--warning-light))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
          light: "hsl(var(--danger-light))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          light: "hsl(var(--info-light))",
        },
        /* Campus brand alias */
        campus: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          soft: "hsl(var(--primary-soft))",
        },
      },


      /* ─── Border Radius Scale ────────────────────────────── */
      borderRadius: {
        sm: "var(--radius-sm)",        /* 6px */
        DEFAULT: "var(--radius)",       /* 8px */
        md: "var(--radius)",            /* 8px */
        lg: "var(--radius-card)",       /* 10px */
        xl: "var(--radius-drawer)",     /* 12px */
        "2xl": "var(--radius-modal)",   /* 14px */
        pill: "var(--radius-pill)",     /* 9999px */
      },

      /* ─── Spacing (aliased from 4px scale) ───────────────── */
      spacing: {
        "0.5": "2px",
        "1": "4px",
        "1.5": "6px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
        "18": "72px",
        "sidebar": "var(--sidebar-width)",
        "sidebar-collapsed": "var(--sidebar-collapsed-width)",
      },

      /* ─── Box Shadow (restrained — only for elevated) ───── */
      boxShadow: {
        "xs": "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        "sm": "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)",
        "drawer": "0 0 40px -4px rgb(0 0 0 / 0.12)",
        "modal": "0 16px 70px -10px rgb(0 0 0 / 0.20), 0 8px 24px -6px rgb(0 0 0 / 0.08)",
        "popover": "0 4px 20px -2px rgb(0 0 0 / 0.12), 0 2px 6px -1px rgb(0 0 0 / 0.06)",
        "sticky": "0 -1px 0 0 rgb(0 0 0 / 0.06), 0 2px 8px -2px rgb(0 0 0 / 0.08)",
      },

      /* ─── Transitions ────────────────────────────────────── */
      transitionDuration: {
        "fast": "150ms",
        "normal": "200ms",
        "slow": "300ms",
      },

      /* ─── Width / Max-width ──────────────────────────────── */
      maxWidth: {
        "page": "1200px",
        "content": "960px",
        "form": "640px",
        "dialog": "480px",
      },

      /* ─── Z-Index Scale ──────────────────────────────────── */
      zIndex: {
        "header": "40",
        "sidebar": "45",
        "drawer": "50",
        "modal": "60",
        "popover": "70",
        "toast": "80",
        "tooltip": "90",
      },

      /* ─── Keyframes ──────────────────────────────────────── */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.96)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "skeleton": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.2s ease-out",
        "slide-down": "slide-down 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "skeleton": "skeleton 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
