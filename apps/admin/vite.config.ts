import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: { alias: { '@': decodeURIComponent(new URL('./src', import.meta.url).pathname).replace(/^\/(\w:)/, '$1') } },
});
