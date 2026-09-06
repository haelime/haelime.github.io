import assert from 'node:assert/strict';
import { createBoids, stepBoids, WIDTH, HEIGHT } from '../src/lib/boids.mjs';

const pair = [{ x: 200, y: 200, vx: 0, vy: 70 }, { x: 220, y: 200, vx: 0, vy: 70 }];
const run = (weights) => stepBoids(pair, 1 / 60, weights);
assert.ok(run({ separation: 1, alignment: 0, cohesion: 0 })[0].vx < 0);
assert.ok(run({ separation: 0, alignment: 0, cohesion: 1 })[0].vx > 0);
const aligned = stepBoids([pair[0], { ...pair[1], vx: 70, vy: 0 }], 1 / 60,
  { separation: 0, alignment: 1, cohesion: 0 });
assert.ok(aligned[0].vx > 0 && aligned[0].vy < 70);
assert.deepEqual(pair[0], { x: 200, y: 200, vx: 0, vy: 70 });
const wrap = stepBoids([{ x: WIDTH - 0.1, y: 10, vx: 70, vy: 0 }], 1 / 60,
  { separation: 0, alignment: 0, cohesion: 0 });
assert.ok(wrap[0].x < 2);
let seed = 123;
let flock = createBoids(100, () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32));
for (let i = 0; i < 600; i++) flock = stepBoids(flock, 1 / 60, { separation: 1.5, alignment: 1, cohesion: 1 });
assert.ok(flock.every(b => Object.values(b).every(Number.isFinite) && b.x >= 0 && b.x < WIDTH && b.y >= 0 && b.y < HEIGHT));
console.log('Boids rules, snapshot updates, wrapping and 600 simulation steps passed.');
