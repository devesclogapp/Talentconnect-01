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
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
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

                // Talent Connect Specific (mapped to Shadcn)
                'bg-primary': 'var(--bg-primary)',
                'bg-secondary': 'var(--bg-secondary)',
                'bg-tertiary': 'var(--bg-tertiary)',
                'brand-primary': '#FF6B00',
                'brand-secondary': '#FFFFFF',
                'accent-primary': 'var(--accent-primary)',
                'accent-secondary': 'var(--accent-secondary)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-tertiary': 'var(--text-tertiary)',

                // Legacy / Semantic Mapping - FIXED
                'primary-green': 'var(--success)',
                'primary-black': 'var(--accent-primary)',
                'app-bg': 'var(--bg-primary)',
                'app-text': 'var(--text-primary)',

                // Missing Colors Definition
                'black-green': '#002200',
                'black-green-dark': '#001100',

                'feedback-success': 'var(--success)',
                'feedback-warning': 'var(--warning)',
                'feedback-error': 'var(--error)',
                'feedback-info': 'var(--info)',

                'border-subtle': 'var(--border-subtle)',
                'border-medium': 'var(--border-medium)',

                success: {
                    DEFAULT: 'var(--success)',
                },
                error: {
                    DEFAULT: 'var(--error)',
                },
                warning: {
                    DEFAULT: 'var(--warning)',
                },
                info: {
                    DEFAULT: 'var(--info)',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                'lg': 'var(--radius)',
                'md': 'calc(var(--radius) - 2px)',
                'sm': 'calc(var(--radius) - 4px)',
                'xl': 'var(--radius-xl)',
                '2xl': 'var(--radius-2xl)',
                'full': 'var(--radius-full)',
            },
            boxShadow: {
                'glow': 'var(--glow-accent)',
                'md': 'var(--shadow-md)',
                'lg': 'var(--shadow-lg)',
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
