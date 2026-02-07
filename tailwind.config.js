/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Financial Design System Colors
                'bg-primary': 'var(--bg-primary)',
                'bg-secondary': 'var(--bg-secondary)',
                'bg-tertiary': 'var(--bg-tertiary)',
                'accent-primary': 'var(--accent-primary)',
                'accent-secondary': 'var(--accent-secondary)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-tertiary': 'var(--text-tertiary)',

                // Legacy / Semantic Mapping - FIXED
                'primary-green': 'var(--success)', // Now actually Green
                'primary-black': 'var(--accent-primary)', // Now actually Black/Accent
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
                'sm': 'var(--radius-sm)',
                'md': 'var(--radius-md)',
                'lg': 'var(--radius-lg)',
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
            }
        },
    },
    plugins: [],
}
