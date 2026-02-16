// Card data (prototype)
// cost is an object with R/G/B integers.
// Theme: Knights, Dragons, Wizards, and dark monsters.

export const COLORS = ['R', 'G', 'B'];

// Color identity (loose):
// - R (Red): fire, dragons, berserkers, direct aggression
// - G (Green): knights, beasts, resilience, big bodies
// - B (Blue): wizards, wards, control-ish bodies (spells later)

export const STARTER_DECK = [
  // --- R: Dragons / fire / aggression ---
  { id: 'r1', name: 'Whelp of Emberpeak', tribe: 'Dragon', cost: { R: 1 }, atk: 2, hp: 1, text: 'A small dragon is still a dragon.' },
  { id: 'r2', name: 'Flamebound Raider', tribe: 'Raider', cost: { R: 2 }, atk: 3, hp: 2, text: 'Hits first. Thinks later.' },
  { id: 'r3', name: 'Cinder Drake', tribe: 'Dragon', cost: { R: 3 }, atk: 5, hp: 3, text: 'The sky crackles. The ground burns.' },

  // --- G: Knights / guardians / beasts ---
  { id: 'g1', name: 'Squire of Dawn', tribe: 'Knight', cost: { G: 1 }, atk: 1, hp: 3, text: 'Shield up. Head down.' },
  { id: 'g2', name: 'Grovewarden', tribe: 'Knight', cost: { G: 2 }, atk: 3, hp: 3, text: 'Steel and bark. Both hold.' },
  { id: 'g3', name: 'Ancient Direbear', tribe: 'Beast', cost: { G: 3 }, atk: 4, hp: 6, text: 'Old forests remember old hunger.' },

  // --- B: Wizards / wards / dark bargains ---
  { id: 'b1', name: 'Apprentice Arcanist', tribe: 'Wizard', cost: { B: 1 }, atk: 1, hp: 2, text: 'Knows one spell. Uses it twice.' },
  { id: 'b2', name: 'Runesmith Adept', tribe: 'Wizard', cost: { B: 2 }, atk: 2, hp: 4, text: 'Every rune is a rule.' },
  { id: 'b3', name: 'Stormveil Magus', tribe: 'Wizard', cost: { B: 3 }, atk: 3, hp: 5, text: 'Thunder answers to ink.' },

  // --- Dual-color: archetype glue ---
  { id: 'rg1', name: 'Wyvern Lancer', tribe: 'Knight', cost: { R: 1, G: 1 }, atk: 3, hp: 2, text: 'When the lances rise, the wyverns follow.' },
  { id: 'gb1', name: 'Oathbound Seer', tribe: 'Wizard', cost: { G: 1, B: 1 }, atk: 2, hp: 3, text: 'Sworn to protect. Cursed to know.' },
  { id: 'rb1', name: 'Hexfire Cultist', tribe: 'Cultist', cost: { R: 1, B: 1 }, atk: 3, hp: 1, text: 'Burn the page. Keep the spell.' },

  // --- Dark monsters (use as “neutral-ish” for now) ---
  { id: 'd1', name: 'Grave Mireling', tribe: 'Undead', cost: { G: 1 }, atk: 2, hp: 2, text: 'It crawls where the light won\'t.' },
];

export function cloneCard(card) {
  return JSON.parse(JSON.stringify(card));
}

export function formatCost(cost) {
  const parts = [];
  for (const c of COLORS) {
    const v = cost?.[c] ?? 0;
    if (v > 0) parts.push(`${c}${v}`);
  }
  return parts.length ? parts.join(' ') : '0';
}

export function canPay(cost, mana) {
  for (const c of COLORS) {
    const need = cost?.[c] ?? 0;
    if ((mana?.[c] ?? 0) < need) return false;
  }
  return true;
}

export function pay(cost, mana) {
  const next = { ...mana };
  for (const c of COLORS) {
    const need = cost?.[c] ?? 0;
    next[c] = (next[c] ?? 0) - need;
  }
  return next;
}
