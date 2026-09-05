import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://haelime.github.io',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory'
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !['/posts/point-nemo/'].some((path) => page.endsWith(path))
    })
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark'
    }
  },
  vite: {
    server: {
      watch: {
        ignored: [
          '**/ForThePeople/**',
          '**/GPUBoidsSimulation/**',
          '**/miniRT/**',
          '**/_posts/**',
          '**/_tabs/**',
          '**/_includes/**',
          '**/_plugins/**',
          '**/_site/**'
        ]
      }
    }
  }
});
