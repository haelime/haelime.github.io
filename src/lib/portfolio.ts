import type { CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'portfolio'>;
export type ProjectGroup = Project['data']['project_group'];

export const projectSlug = (project: Project) =>
  project.id.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.(md|mdx)$/, '');

export const projectPath = (project: Project) =>
  project.data.permalink ?? `/posts/${projectSlug(project)}/`;

export const taxonomySlug = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/#/g, '-sharp')
    .replace(/\./g, '-dot-')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

export const sortProjects = (projects: Project[]) =>
  [...projects].sort((a, b) => a.data.project_order - b.data.project_order);

export const visibleProjects = (projects: Project[], includeHiddenFromHome = true) =>
  sortProjects(
    projects.filter(
      (project) =>
        project.data.portfolio &&
        !project.data.unlisted &&
        (includeHiddenFromHome || !project.data.hide_from_home)
    )
  );
