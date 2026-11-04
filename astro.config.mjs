import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

import tailwindcss from '@tailwindcss/vite';

// Film recording sets for scripts/record-films.mjs exist only under `astro dev`;
// builds never route or bundle them, so their stylesheet cannot ship.
const devFilmRoutes = {
  name: 'dev-film-routes',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev') {
        injectRoute({ pattern: '/dev/films/[slug]', entrypoint: './src/dev/film-set.astro' });
      }
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://www.vrajmpatel.com',
  trailingSlash: 'ignore',
  prefetch: true,

  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap({
    serialize: (page) => ({ ...page, url: page.url.replace(/\/?$/, '/') }),
  }), icon({ iconDir: 'src/assets', include: { 'fa6-brands': ['github', 'linkedin-in'] } }), devFilmRoutes],
});
