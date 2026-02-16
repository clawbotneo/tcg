// Generate card art via OpenAI Images API.
// Requirements:
//   export OPENAI_API_KEY='sk-...'
// Usage:
//   node generate-art.mjs
// Notes:
//   - Writes PNG files to assets/cards/<id>.png
//   - Skips if file already exists.

import fs from 'node:fs';
import path from 'node:path';

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Missing OPENAI_API_KEY env var.');
  process.exit(1);
}

const MODEL = process.env.IMAGE_MODEL || 'gpt-image-1';
const SIZE = process.env.IMAGE_SIZE || '1024x1024';

const cardsMod = await import(path.resolve('./cards.js'));
const deck = cardsMod.STARTER_DECK;

fs.mkdirSync('assets/cards', { recursive: true });

async function genOne(card) {
  const outPath = `assets/cards/${card.id}.png`;
  if (fs.existsSync(outPath)) {
    console.log('skip', outPath);
    return;
  }
  if (!card.artPrompt) {
    console.log('no prompt for', card.id);
    return;
  }

  const body = {
    model: MODEL,
    prompt: card.artPrompt,
    size: SIZE,
    // Prefer base64 so we don't deal with temporary URLs
    response_format: 'b64_json',
  };

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 500)}`);
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error('No b64_json in response');

  fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
  console.log('wrote', outPath);
}

for (const card of deck) {
  await genOne(card);
}
