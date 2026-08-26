// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

const projectContentUrl = new URL('./src/content/projects/', import.meta.url);
const archivedProjectPaths = new Set(
  readdirSync(projectContentUrl)
    .filter((fileName) => fileName.endsWith('.md'))
    .filter((fileName) => {
      const source = readFileSync(new URL(fileName, projectContentUrl), 'utf8');
      const frontmatter = source.split('---', 3)[1] ?? '';
      return /^visibility:\s*['"]?archived['"]?\s*$/m.test(frontmatter);
    })
    .map(
      (fileName) => '/projects/' + fileName.slice(0, -'.md'.length) + '/',
    ),
);

// https://astro.build/config
export default defineConfig({
  site: 'https://www.vrajmpatel.com',

  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter: (page) => !archivedProjectPaths.has(new URL(page).pathname),
    }),
  ],
});
