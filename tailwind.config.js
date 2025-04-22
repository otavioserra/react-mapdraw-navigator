// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html", // Inclui o HTML principal
        "./src/**/*.{js,ts,jsx,tsx}", // Inclui TODOS os arquivos JS/TS/JSX/TSX dentro de src
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
