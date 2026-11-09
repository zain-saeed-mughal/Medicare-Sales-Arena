import {defineConfig} from 'vite'; import tailwind from '@tailwindcss/vite'; export default defineConfig({esbuild:{jsx:"automatic"},plugins:[tailwind()]})

