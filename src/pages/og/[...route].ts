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
    bgGradient: [[15, 23, 42]],
    border: {
      color: [37, 99, 235],
      width: 10,
      side: "inline-start",
    },
    font: {
      title: {
        weight: 'Bold',
        families: ['Inter']
      },
      description: {
        weight: 'Normal',
        families: ['Inter']
      }
    },
    fonts: [
      './node_modules/@fontsource/inter/files/inter-latin-400-normal.woff',
      './node_modules/@fontsource/inter/files/inter-latin-700-normal.woff'
    ]
  }),
});
