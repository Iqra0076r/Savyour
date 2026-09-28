import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
const root = process.cwd();
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES_BASE || '/',
  build: {rollupOptions: {input: Object.fromEntries(['', 'supported-sites', 'how-it-works', 'faq', 'about'].map(slug => [slug || 'home', resolve(root, slug, 'index.html')]))}},
});
