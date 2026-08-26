import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export const blogSlug = (post: BlogPost) =>
  post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.(md|mdx)$/, '');

export const blogPath = (post: BlogPost) => `/blog/${blogSlug(post)}/`;
