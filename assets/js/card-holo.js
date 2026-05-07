export const HOLO_EFFECTS = [
  {
    name: "regular-holo",
    rarity: "rare holo",
    subtypes: "basic",
    supertype: "pokémon",
  },
  {
    name: "cosmos-holo",
    rarity: "rare holo cosmos",
    subtypes: "basic",
    supertype: "pokémon",
  },
  {
    name: "v-regular",
    rarity: "rare holo v",
    subtypes: "v",
    supertype: "pokémon",
  },
  {
    name: "v-max",
    rarity: "rare holo vmax",
    subtypes: "vmax",
    supertype: "pokémon",
  },
  {
    name: "v-star",
    rarity: "rare holo vstar",
    subtypes: "vstar",
    supertype: "pokémon",
  },
  {
    name: "rainbow-holo",
    rarity: "rare rainbow",
    subtypes: "basic",
    supertype: "pokémon",
  },
  {
    name: "rainbow-alt",
    rarity: "rare rainbow alt",
    subtypes: "vmax",
    supertype: "pokémon",
  },
  {
    name: "radiant-holo",
    rarity: "radiant rare",
    subtypes: "radiant",
    supertype: "pokémon",
  },
  {
    name: "amazing-rare",
    rarity: "amazing rare",
    subtypes: "basic",
    supertype: "pokémon",
  },
  {
    name: "reverse-holo",
    rarity: "rare reverse holo",
    subtypes: "basic",
    supertype: "pokémon",
  },
  {
    name: "secret-rare",
    rarity: "rare secret",
    subtypes: "basic",
    supertype: "pokémon",
  },
  {
    name: "trainer-gallery",
    rarity: "trainer gallery rare holo",
    subtypes: "basic",
    supertype: "pokémon",
    trainerGallery: true,
  },
  {
    name: "trainer-gallery-secret",
    rarity: "rare secret",
    subtypes: "basic",
    supertype: "pokémon",
    trainerGallery: true,
  },
];

const choose = (items) => items[Math.floor(Math.random() * items.length)];
const number = (value, precision = 4) => Number(value.toFixed(precision));

export function installCardHolo(card, index = 0, options = {}) {
  const requested = typeof options.effect === "string"
    ? HOLO_EFFECTS.find((effect) => effect.name === options.effect)
    : undefined;
  const effect = requested || choose(HOLO_EFFECTS);
  const seedX = Math.random();
  const seedY = Math.random();
  const cosmosX = Math.floor(seedX * 734);
  const cosmosY = Math.floor(seedY * 1280);

  card.dataset.holoCard = "";
  card.dataset.holoEffect = effect.name;
  card.dataset.rarity = effect.rarity;
  card.dataset.subtypes = effect.subtypes;
  card.dataset.supertype = effect.supertype;
  card.dataset.trainerGallery = effect.trainerGallery ? "true" : "false";
  card.dataset.set = "landing";
  card.dataset.number = String(index + 1).padStart(3, "0");
  card.classList.remove("masked");

  card.style.setProperty("--seedx", number(seedX));
  card.style.setProperty("--seedy", number(seedY));
  card.style.setProperty("--cosmosbg", `${cosmosX}px ${cosmosY}px`);
  card.style.setProperty("--holo-seed-x", number(seedX));
  card.style.setProperty("--holo-seed-y", number(seedY));

  return effect.name;
}
