import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';
import { execFileSync } from 'node:child_process';

const gitValue = (args, fallback) => {
  try {
    return execFileSync('git', args, {
      cwd: new URL('.', import.meta.url),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 1500,
    }).trim() || fallback;
  } catch {
    return fallback;
  }
};

// One timestamp for every page in this build; SOURCE_DATE_EPOCH allows reproducible builds.
const sourceEpoch = Number(process.env.SOURCE_DATE_EPOCH);
const builtAt = new Date(
  process.env.SOURCE_DATE_EPOCH && Number.isFinite(sourceEpoch) && sourceEpoch >= 0 && sourceEpoch <= 8.64e12
    ? sourceEpoch * 1000
    : Date.now(),
).toISOString();
const buildSha = gitValue(['rev-parse', '--short=7', 'HEAD'], 'local');
const buildBranch = gitValue(['branch', '--show-current'], 'detached');

// https://astro.build/config
export default defineConfig({
  site: 'https://www.vrajmpatel.com',

  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.PUBLIC_BUILD_SHA': JSON.stringify(buildSha),
      'import.meta.env.PUBLIC_BUILD_BRANCH': JSON.stringify(buildBranch),
      'import.meta.env.PUBLIC_BUILD_TIME': JSON.stringify(builtAt),
    },
  },
  integrations: [sitemap()],
});
