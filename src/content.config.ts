import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: z.object({
    organization: z.string(),
    title: z.string(),
    period: z.string(),
    order: z.number(),
    location: z.string().optional(),
    organizationMark: z.enum(['cu-boulder', 'purdue-l3harris']).optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    domain: z.enum([
      'Machine Learning',
      'Software Engineering',
      'Systems Infrastructure',
      'Research',
    ]),
    visibility: z.enum(['public', 'archived']).default('public'),
    presentation: z.enum(['case-study', 'note']).default('case-study'),
    featured: z.boolean().optional(),
    order: z.number().optional(),
    tech: z.array(z.string()).optional(),
    github: z.url().optional(),
    link: z.url().optional(),
    paper: z.string().optional(),
    notebook: z.url().optional(),
    privateRepo: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
  }),
});

export const collections = { experience, projects };
