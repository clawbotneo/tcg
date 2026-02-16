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
  { id: 'r1', name: 'Whelp of Emberpeak', art: 'assets/cards/r1.png', artPrompt: 'A small red dragon whelp perched on a cracked obsidian rock, embers drifting in the air, glowing lava fissures below, dramatic rim light, smoke and heat haze , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Dragon', cost: { R: 1 }, atk: 2, hp: 1, text: 'A small dragon is still a dragon.' },
  { id: 'r2', name: 'Flamebound Raider', art: 'assets/cards/r2.png', artPrompt: 'A battle-worn raider in scorched leather with a flaming axe, sprinting through a burning village street, sparks and ash swirling , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Raider', cost: { R: 2 }, atk: 3, hp: 2, text: 'Hits first. Thinks later.' },
  { id: 'r3', name: 'Cinder Drake', art: 'assets/cards/r3.png', artPrompt: 'A mid-sized fire drake swooping low with wings spread, breathing a stream of flame into dark storm clouds, glowing scales, volcanic smoke behind , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Dragon', cost: { R: 3 }, atk: 5, hp: 3, text: 'The sky crackles. The ground burns.' },

  // --- G: Knights / guardians / beasts ---
  { id: 'g1', name: 'Squire of Dawn', art: 'assets/cards/g1.png', artPrompt: 'A young knight squire holding a polished shield and simple sword, standing at sunrise on a misty battlefield, golden light reflecting off steel , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Knight', cost: { G: 1 }, atk: 1, hp: 3, text: 'Shield up. Head down.' },
  { id: 'g2', name: 'Grovewarden', art: 'assets/cards/g2.png', artPrompt: 'A seasoned knight in green-and-steel armor with leaf motifs, standing in an ancient forest glade with soft shafts of light, moss and vines , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Knight', cost: { G: 2 }, atk: 3, hp: 3, armour: 1, text: 'Steel and bark. Both hold.' },
  { id: 'g3', name: 'Ancient Direbear', art: 'assets/cards/g3.png', artPrompt: 'A massive ancient dire bear with scarred fur and glowing eyes, emerging from fog in a primeval forest, mushrooms and roots , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Beast', cost: { G: 3 }, atk: 4, hp: 6, text: 'Old forests remember old hunger.' },

  // --- B: Wizards / wards / dark bargains ---
  { id: 'b1', name: 'Apprentice Arcanist', art: 'assets/cards/b1.png', artPrompt: 'A young wizard apprentice with a staff and a faintly glowing rune orb, arcane library background blurred, blue-white magic light illuminating face , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Wizard', cost: { B: 1 }, atk: 1, hp: 2, shield: 1, text: 'Knows one spell. Uses it twice.' },
  { id: 'b2', name: 'Runesmith Adept', art: 'assets/cards/b2.png', artPrompt: 'A runesmith mage carving glowing runes into a stone tablet with a chisel, sparks of blue magic, workshop clutter blurred , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Wizard', cost: { B: 2 }, atk: 2, hp: 4, shield: 2, text: 'Every rune is a rule.' },
  { id: 'b3', name: 'Stormveil Magus', art: 'assets/cards/b3.png', artPrompt: 'A powerful wizard in dark blue robes raising a hand to command lightning, storm clouds and rain behind, electric glow highlights , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Wizard', cost: { B: 3 }, atk: 3, hp: 5, shield: 2, text: 'Thunder answers to ink.' },

  // --- Dual-color: archetype glue ---
  { id: 'rg1', name: 'Wyvern Lancer', art: 'assets/cards/rg1.png', artPrompt: 'A knight lancer riding a wyvern in mid-flight over a rugged mountain pass, spear forward, wind and clouds , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Knight', cost: { R: 1, G: 1 }, atk: 3, hp: 2, text: 'When the lances rise, the wyverns follow.' },
  { id: 'gb1', name: 'Oathbound Seer', art: 'assets/cards/gb1.png', artPrompt: 'A seer mage with a hooded cloak and a silver oath pendant, holding a glowing scrying bowl, faint green forest light mixed with blue arcane light , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Wizard', cost: { G: 1, B: 1 }, atk: 2, hp: 3, text: 'Sworn to protect. Cursed to know.' },
  { id: 'rb1', name: 'Hexfire Cultist', art: 'assets/cards/rb1.png', artPrompt: 'A dangerous cultist with a half-burned grimoire and hands wreathed in red-blue hexfire, candlelit ritual chamber blurred, ominous mood , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Cultist', cost: { R: 1, B: 1 }, atk: 3, hp: 1, text: 'Burn the page. Keep the spell.' },

  // --- Dark monsters (use as “neutral-ish” for now) ---
  { id: 'd1', name: 'Grave Mireling', art: 'assets/cards/d1.png', artPrompt: 'A small undead mire creature crawling out of a swamp, pale necrotic glow, dark reeds and fog, unsettling but clear silhouette , realistic painterly high-fantasy illustration, cinematic lighting, highly detailed, muted but rich color palette, centered subject, clean readable silhouette, shallow depth of field, NO text, NO watermark, NO logo, NO UI, NO frame, square composition', tribe: 'Undead', cost: { G: 1 }, atk: 2, hp: 2, text: 'It crawls where the light won\'t.' },
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
