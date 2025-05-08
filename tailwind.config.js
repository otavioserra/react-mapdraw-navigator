// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    safelist: [
        'w-[calc(100% - 8px)]',
        'w-[calc(100% - 4px)]',
        'w-[calc(100% - 2px)]',
        'h-[600px]',
        'h-[500px]',
        'h-[300px]',
        'border-4',
        'border-2',
        'border',
    ],
    plugins: [],
}
