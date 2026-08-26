import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/portfolio' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    categories: z.array(z.string()).default(['Portfolio']),
    tags: z.array(z.string()).default([]),
    description: z.string(),
    image: z.object({
      path: z.string(),
      alt: z.string()
    }).optional(),
    thumbnail: z.string().optional(),
    stack: z.string(),
    project_order: z.number().default(999),
    project_group: z.enum(['games', 'graphics', 'general']).default('games'),
    project_subgroup: z.enum(['misc']).optional(),
    portfolio: z.boolean().default(true),
    hide_from_home: z.boolean().default(false),
    unlisted: z.boolean().default(false),
    permalink: z.string().optional(),
    toc: z.boolean().default(true),
    mermaid: z.boolean().default(false),
    noindex: z.boolean().default(false),
    sitemap: z.boolean().default(true)
  })
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    image: z.object({
      path: z.string(),
      alt: z.string()
    }).optional(),
    draft: z.boolean().default(false),
    toc: z.boolean().default(true)
  })
});

export const collections = { portfolio, blog };
