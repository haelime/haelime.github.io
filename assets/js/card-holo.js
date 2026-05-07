const HOLO_VARIANTS = ["aurora", "prism", "cosmos", "etched"];

const percent = (value) => `${Math.round(value * 100)}%`;
const number = (value, precision = 4) => Number(value.toFixed(precision));

export function installCardHolo(card, index = 0) {
  const variant = HOLO_VARIANTS[Math.floor(Math.random() * HOLO_VARIANTS.length)];
  const seedX = Math.random();
  const seedY = Math.random();
  const strength = 0.58 + Math.random() * 0.34;
  const scale = 180 + Math.round(Math.random() * 130);
  const angle = -65 + Math.round(Math.random() * 130);

  card.dataset.holo = variant;
  card.style.setProperty("--holo-seed-x", number(seedX));
  card.style.setProperty("--holo-seed-y", number(seedY));
  card.style.setProperty("--holo-strength", number(strength, 3));
  card.style.setProperty("--holo-scale", `${scale}%`);
  card.style.setProperty("--holo-angle", `${angle}deg`);
  card.style.setProperty("--holo-cross-angle", `${angle + 90}deg`);
  card.style.setProperty("--holo-shift", `${Math.round(seedX * 100)}%`);
  card.style.setProperty("--holo-small-x", `${Math.round(52 + seedX * 38)}px`);
  card.style.setProperty("--holo-small-y", `${Math.round(54 + seedY * 42)}px`);
  card.style.setProperty("--holo-mid-x", `${Math.round(82 + seedY * 34)}px`);
  card.style.setProperty("--holo-mid-y", `${Math.round(76 + seedX * 46)}px`);
  card.style.setProperty("--holo-large-x", `${Math.round(118 + seedX * 52)}px`);
  card.style.setProperty("--holo-large-y", `${Math.round(106 + seedY * 48)}px`);
  card.style.setProperty("--holo-cosmos-small-x", `${Math.round(34 + seedX * 42)}px`);
  card.style.setProperty("--holo-cosmos-small-y", `${Math.round(38 + seedY * 40)}px`);
  card.style.setProperty("--holo-cosmos-large-x", `${Math.round(88 + seedY * 68)}px`);
  card.style.setProperty("--holo-cosmos-large-y", `${Math.round(82 + seedX * 62)}px`);
  card.style.setProperty("--holo-dot-a", `${percent((seedX + 0.18 * index) % 1)} ${percent((seedY + 0.31) % 1)}`);
  card.style.setProperty("--holo-dot-b", `${percent((seedX + 0.47) % 1)} ${percent((seedY + 0.13 * index) % 1)}`);
  card.style.setProperty("--holo-dot-c", `${percent((seedX + 0.69) % 1)} ${percent((seedY + 0.58) % 1)}`);
}
