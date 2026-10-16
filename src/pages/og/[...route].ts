import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';
import { isPublicProject } from '../../lib/projects';

const collection = (await getCollection('projects')).filter(isPublicProject);
const pages = Object.fromEntries(
  collection.map(({ id, data }) => [id, data])
);

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: async (_path, page: any) => ({
    title: page.title,
    description: page.summary || "Selected work by Vraj Patel.",
    bgGradient: [[248, 247, 242]],
    border: {
      color: [49, 72, 218],
      width: 10,
      side: "inline-start",
    },
    font: {
      title: {
        weight: 'Normal',
        color: [22, 22, 29],
        families: ['Instrument Serif']
      },
      description: {
        weight: 'Normal',
        color: [78, 77, 90],
        families: ['IBM Plex Mono']
      }
    },
    fonts: [
      './node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff',
      './node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff'
    ]
  }),
});
