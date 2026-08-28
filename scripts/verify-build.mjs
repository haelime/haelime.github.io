import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = new URL('../dist/', import.meta.url);
const rootPath = root.pathname.replace(/^\/(.:\/)/, '$1');

const expectedRoutes = [
  '/',
  '/projects/',
  '/blog/',
  '/about/',
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
  '/posts/idle-together/',
  '/posts/model-activity/',
  '/posts/oiia-cat/',
  '/posts/cat-meme-detector/'
];

const routeFile = (route) =>
  route === '/'
    ? join(rootPath, 'index.html')
    : join(rootPath, route.replace(/^\//, ''), 'index.html');
const failures = [];

for (const route of expectedRoutes) {
  if (!existsSync(routeFile(route))) failures.push(`missing route: ${route}`);
}
if (existsSync(routeFile('/resume/'))) failures.push('retired resume route still exists');

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

const projects = readFileSync(routeFile('/projects/'), 'utf8');
const modelActivityPath = '/posts/model-activity/';
const oiiaCatPath = '/posts/oiia-cat/';
const autonomousShuttlePath = '/posts/autonomous-shuttle-systems/';
if (!projects.includes(`href="${modelActivityPath}"`)) failures.push('Model activity missing from projects');
if (!projects.includes(`href="${oiiaCatPath}"`)) failures.push('Oiia Cat missing from projects');
if (projects.includes(`href="${autonomousShuttlePath}"`)) failures.push('Career project leaked into general projects');
if (!projects.includes('<summary><span>기타</span>')) failures.push('Collapsible general group missing');
if (!projects.includes('<summary><span>진짜 기타</span>')) failures.push('Nested misc group missing');
if (projects.indexOf(modelActivityPath) < projects.indexOf(oiiaCatPath)) {
  failures.push('Model activity is not nested after the general projects');
}

const home = readFileSync(routeFile('/'), 'utf8');
if (!home.includes(`href="${modelActivityPath}"`)) failures.push('Model activity missing from landing portfolio');
if (!home.includes(`href="${oiiaCatPath}"`)) failures.push('Oiia Cat missing from landing portfolio');
if ((home.match(new RegExp(`href="${autonomousShuttlePath}"`, 'g')) ?? []).length !== 1) {
  failures.push('Autonomous shuttle career detail link missing or duplicated');
}
if (!home.includes('href="/blog/"')) failures.push('Blog navigation link missing');
if (home.includes('href="/resume/"')) failures.push('Resume navigation link still exists');
if (home.includes('href="/about/"')) failures.push('About navigation link still exists');

const blog = readFileSync(routeFile('/blog/'), 'utf8');
if (!blog.includes('class="blog-board"')) failures.push('Blog board missing');

const catMemeDetector = readFileSync(routeFile('/posts/cat-meme-detector/'), 'utf8');
if (!catMemeDetector.includes('2026.08.27–2026.08.28')) failures.push('Cat Meme Detector period missing');
if (!catMemeDetector.includes('GitHub Repository')) failures.push('Cat Meme Detector repository link missing');
if (!catMemeDetector.includes('project-media-placeholder')) failures.push('Cat Meme Detector media placeholder missing');
if (!catMemeDetector.includes('Windows 배포 과정을 자동화')) failures.push('Cat Meme Detector deployment work missing');
if (catMemeDetector.includes('Troubleshooting')) failures.push('Unsupported Cat Meme Detector troubleshooting should be omitted');
if (catMemeDetector.includes('성능 향상 수치는 주장')) failures.push('Cat Meme Detector contains editorial meta-commentary');

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
