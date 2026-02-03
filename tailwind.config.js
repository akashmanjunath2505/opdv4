export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'aivana-dark': '#0D0D0D',
                'aivana-dark-sider': '#000000',
                'aivana-grey': '#212121',
                'aivana-light-grey': '#333333',
                'aivana-text': '#E5E5E5',
                'aivana-accent': '#8A63D2',
                'aivana-fogsi-blue': '#1E3A8A',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                dotPulse: {
                    '0%, 100%': { opacity: '0.2' },
                    '50%': { opacity: '1' },
                },
                pulseRing: {
                    '0%': { transform: 'scale(0.8)', opacity: '0.5' },
                    '80%, 100%': { transform: 'scale(1.4)', opacity: '0' },
                }
            },
            animation: {
                fadeInUp: 'fadeInUp 0.5s ease-out forwards',
                dotPulse: 'dotPulse 1.4s infinite ease-in-out',
                pulseRing: 'pulseRing 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
