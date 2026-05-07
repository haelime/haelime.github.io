export const HOLO_EFFECTS = ["regular", "cosmos", "sunpillar", "rainbow", "etched", "glitter"];

const percent = (value) => `${Math.round(value * 100)}%`;
const number = (value, precision = 4) => Number(value.toFixed(precision));
const choose = (items) => items[Math.floor(Math.random() * items.length)];

export function installCardHolo(card, index = 0, options = {}) {
  const effect = HOLO_EFFECTS.includes(options.effect) ? options.effect : choose(HOLO_EFFECTS);
  const seedX = Math.random();
  const seedY = Math.random();
  const intensity = 0.58 + Math.random() * 0.36;
  const scale = 185 + Math.round(Math.random() * 145);
  const angle = -68 + Math.round(Math.random() * 136);
  const cosmosX = Math.floor(seedX * 734);
  const cosmosY = Math.floor(seedY * 1280);

  card.dataset.holoCard = "";
  card.dataset.holoEffect = effect;

  card.style.setProperty("--holo-seed-x", number(seedX));
  card.style.setProperty("--holo-seed-y", number(seedY));
  card.style.setProperty("--holo-intensity", number(intensity, 3));
  card.style.setProperty("--holo-scale", `${scale}%`);
  card.style.setProperty("--holo-angle", `${angle}deg`);
  card.style.setProperty("--holo-cross-angle", `${angle + 90}deg`);
  card.style.setProperty("--holo-shift", `${Math.round(seedX * 100)}%`);
  card.style.setProperty("--cosmosbg", `${cosmosX}px ${cosmosY}px`);
  card.style.setProperty("--holo-small-x", `${Math.round(42 + seedX * 38)}px`);
  card.style.setProperty("--holo-small-y", `${Math.round(44 + seedY * 42)}px`);
  card.style.setProperty("--holo-mid-x", `${Math.round(76 + seedY * 42)}px`);
  card.style.setProperty("--holo-mid-y", `${Math.round(74 + seedX * 48)}px`);
  card.style.setProperty("--holo-large-x", `${Math.round(116 + seedX * 62)}px`);
  card.style.setProperty("--holo-large-y", `${Math.round(108 + seedY * 58)}px`);
  card.style.setProperty("--holo-spark-a", `${percent((seedX + 0.18 * index) % 1)} ${percent((seedY + 0.31) % 1)}`);
  card.style.setProperty("--holo-spark-b", `${percent((seedX + 0.47) % 1)} ${percent((seedY + 0.13 * index) % 1)}`);
  card.style.setProperty("--holo-spark-c", `${percent((seedX + 0.69) % 1)} ${percent((seedY + 0.58) % 1)}`);

  return effect;
}
