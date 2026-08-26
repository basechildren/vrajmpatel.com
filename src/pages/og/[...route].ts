import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

const collection = await getCollection('projects');
const pages = Object.fromEntries(
  collection.map(({ id, data }) => [id, data])
);

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
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
        weight: 'bold',
        families: ['Inter']
      },
      description: {
        weight: 'normal',
        families: ['Inter']
      }
    },
    fonts: [
      './node_modules/@fontsource/inter/files/inter-latin-400-normal.woff',
      './node_modules/@fontsource/inter/files/inter-latin-700-normal.woff'
    ]
  }),
});
