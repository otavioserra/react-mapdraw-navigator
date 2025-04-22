// postcss.config.mjs
export default {
    plugins: {
        // Replace 'tailwindcss' with '@tailwindcss/postcss'
        '@tailwindcss/postcss': {}, // <<< CHANGE THIS LINE
        autoprefixer: {},
    },
}
