/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                // Folioblox Design System Tokens
                'folio-bg': 'var(--bg)',
                'folio-surface': 'var(--surface)',
                'folio-surface2': 'var(--surface2)',
                'folio-card': 'var(--card)',
                'folio-accent': 'var(--accent)',
                'folio-accent-dim': 'var(--accent-dim)',
                'folio-text': 'var(--text)',
                'folio-text-dim': 'var(--text2)',

                // Keep Shadcn/Existing compatibility but map to Folioblox
                border: "var(--border)",
                input: "var(--border)",
                ring: "var(--accent)",
                background: "var(--bg)",
                foreground: "var(--text)",
                primary: {
                    DEFAULT: "var(--accent)",
                    foreground: "#FFFFFF",
                },
                secondary: {
                    DEFAULT: "var(--surface2)",
                    foreground: "var(--text)",
                },
                destructive: {
                    DEFAULT: "var(--red)",
                    foreground: "#FFFFFF",
                },
                muted: {
                    DEFAULT: "var(--surface2)",
                    foreground: "var(--text2)",
                },
                accent: {
                    DEFAULT: "var(--accent-dim)",
                    foreground: "var(--accent)",
                },
                popover: {
                    DEFAULT: "var(--surface)",
                    foreground: "var(--text)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--text)",
                },

                // Semantic
                success: 'var(--green)',
                error: 'var(--red)',
                warning: 'var(--yellow)',
                info: 'var(--blue)',
            },
            fontFamily: {
                sans: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
                display: ['"DM Sans"', 'sans-serif'],
            },
            borderRadius: {
                'lg': 'var(--radius)',
                'md': 'var(--radius-sm)',
                'sm': 'var(--radius-xs)',
                'full': '9999px',
            },
            boxShadow: {
                'folio': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                'md': 'var(--shadow-md)',
                'lg': 'var(--shadow-lg)',
                'glow': 'var(--glow-accent)',
            },
            spacing: {
                'safe-top': 'env(safe-area-inset-top)',
                'safe-bottom': 'env(safe-area-inset-bottom)',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: 0 },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
