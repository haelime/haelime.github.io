import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = new URL('../dist/', import.meta.url);
const rootPath = root.pathname.replace(/^\/(.:\/)/, '$1');

const expectedRoutes = [
  '/',
  '/projects/',
  '/about/',
  '/resume/',
  '/archives/',
  '/categories/',
  '/categories/portfolio/',
  '/tags/',
  '/clasher/',
  '/posts/autonomous-shuttle-systems/',
  '/posts/game-jam-for-the-people/',
  '/posts/gpu-boids-simulation/',
  '/posts/raymarch-shaders/',
  '/posts/minirt/',
  '/posts/rimworld-portrait-overlay/',
  '/posts/idle-together/'
];

const routeFile = (route) =>
  route === '/'
    ? join(rootPath, 'index.html')
    : join(rootPath, route.replace(/^\//, ''), 'index.html');
const failures = [];

for (const route of expectedRoutes) {
  if (!existsSync(routeFile(route))) failures.push(`missing route: ${route}`);
}

const walk = (directory) => readdirSync(directory).flatMap((name) => {
  const path = join(directory, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

const files = walk(rootPath);
const htmlFiles = files.filter((file) => extname(file) === '.html');

const localTarget = (url) => {
  const pathname = url.split(/[?#]/, 1)[0];
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) return null;
  if (pathname === '/') return join(rootPath, 'index.html');
  const relative = pathname.replace(/^\//, '');
  if (extname(relative)) return join(rootPath, relative);
  return join(rootPath, relative, 'index.html');
};

for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, 'utf8');
  if (html.includes('{{') || html.includes('{%')) failures.push(`unrendered Liquid: ${htmlFile}`);

  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const target = localTarget(match[1]);
    if (target && !existsSync(target)) failures.push(`broken local URL in ${htmlFile}: ${match[1]}`);
  }
}

const clasher = readFileSync(routeFile('/clasher/'), 'utf8');
if (!clasher.includes('noindex, nofollow, noarchive')) failures.push('Clasher noindex metadata missing');

for (const route of ['/', '/projects/', '/archives/', '/categories/', '/tags/']) {
  const html = readFileSync(routeFile(route), 'utf8');
  if (html.includes('href="/clasher/"')) failures.push(`Clasher leaked into listing: ${route}`);
}

const sitemapPath = join(rootPath, 'sitemap-0.xml');
if (existsSync(sitemapPath) && readFileSync(sitemapPath, 'utf8').includes('/clasher/')) {
  failures.push('Clasher leaked into sitemap');
}

const css = files.filter((file) => extname(file) === '.css').map((file) => readFileSync(file, 'utf8')).join('\n');
if (!css.includes('50vw')) failures.push('portfolio 50vw image rule missing');

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Verified ${expectedRoutes.length} routes and ${htmlFiles.length} HTML files.`);
