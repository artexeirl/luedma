// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.maquinariasluedma.com.pe',
  output: 'server',
  adapter: vercel(),
  trailingSlash: 'always',
  vite: {
    server: {
      allowedHosts: ['.trycloudflare.com'],
    },
    build: {
      assetsInlineLimit: 0,
      cssCodeSplit: false,
    },
  },
});
