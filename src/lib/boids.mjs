export const WIDTH = 960;
export const HEIGHT = 480;
const SPEED = 70;
const wrap = (value, size) => ((value % size) + size) % size;
const delta = (value, size) => value - Math.round(value / size) * size;

export function createBoids(count = 100, random = Math.random) {
  return Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    return { x: random() * WIDTH, y: random() * HEIGHT,
      vx: Math.cos(angle) * SPEED, vy: Math.sin(angle) * SPEED };
  });
}

export function stepBoids(boids, dt, weights) {
  // ponytail: O(N²) is bounded to 100 boids here; use a spatial grid for larger flocks.
  const next = boids.map((boid, i) => {
    let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, count = 0;
    boids.forEach((other, j) => {
      if (i === j) return;
      const dx = delta(other.x - boid.x, WIDTH);
      const dy = delta(other.y - boid.y, HEIGHT);
      const distance = dx * dx + dy * dy;
      if (distance > 85 * 85 || distance < 0.0001) return;
      count++;
      ax += other.vx; ay += other.vy;
      cx += dx; cy += dy;
      if (distance < 28 * 28) { sx -= dx / distance; sy -= dy / distance; }
    });
    let fx = 0, fy = 0;
    const steer = (x, y, weight) => {
      const length = Math.hypot(x, y);
      if (length < 0.0001 || weight === 0) return;
      const tx = x / length * SPEED - boid.vx;
      const ty = y / length * SPEED - boid.vy;
      const limit = Math.min(1, 90 / (Math.hypot(tx, ty) || 1));
      fx += tx * limit * weight; fy += ty * limit * weight;
    };
    if (count) {
      steer(sx, sy, weights.separation);
      steer(ax / count, ay / count, weights.alignment);
      steer(cx / count, cy / count, weights.cohesion);
    }
    let vx = boid.vx + fx * dt, vy = boid.vy + fy * dt;
    const speed = Math.hypot(vx, vy);
    if (speed > 0.0001) {
      const scale = Math.max(35, Math.min(100, speed)) / speed;
      vx *= scale; vy *= scale;
    }
    return { x: wrap(boid.x + vx * dt, WIDTH), y: wrap(boid.y + vy * dt, HEIGHT), vx, vy };
  });
  return next;
}
