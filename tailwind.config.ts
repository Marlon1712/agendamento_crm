import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            500: '#0ea5e9', // Sky blue for a clean medical/spa feel? Or stick to Pink? 
            // User liked "Moderno" - Let's go with a vibrant violet/fuchsia mix or deep purple.
            // Let's stick to the previous Fuchsia but using Tailwind palette.
            600: '#c026d3',
            700: '#a21caf',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;
