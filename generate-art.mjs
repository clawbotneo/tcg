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

// DALL·E-style models typically expose urls; gpt-image-1 may vary by account.
// Default to dall-e-3 since you asked for DALL·E.
const MODEL = process.env.IMAGE_MODEL || 'dall-e-3';
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

  // API may return either a temporary URL or base64.
  const b64 = json?.data?.[0]?.b64_json;
  const url = json?.data?.[0]?.url;

  if (b64) {
    fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
    console.log('wrote', outPath);
    return;
  }

  if (url) {
    const imgRes = await fetch(url);
    if (!imgRes.ok) throw new Error(`Failed to download image: HTTP ${imgRes.status}`);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    console.log('wrote', outPath);
    return;
  }

  throw new Error('No url or b64_json in response');
}

for (const card of deck) {
  await genOne(card);
}
