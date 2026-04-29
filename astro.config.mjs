// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://www.maquinariasluedma.com.pe',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  trailingSlash: 'always',
  vite: {
    build: {
      assetsInlineLimit: 0,
      cssCodeSplit: false,
    },
  },
});
