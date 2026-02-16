// Generate card art via OpenAI Images API.
// Requirements:
//   export OPENAI_API_KEY='sk-...'
// Usage:
//   node generate-art.mjs
// Notes:
//   - Writes PNG files to assets/cards/<id>.png
//   - Skips if file already exists.
//   - Handles low image rate limits by waiting and retrying.

import fs from 'node:fs';
import path from 'node:path';

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Missing OPENAI_API_KEY env var.');
  process.exit(1);
}

const MODEL = process.env.IMAGE_MODEL || 'gpt-image-1';
const SIZE = process.env.IMAGE_SIZE || '1024x1024';

// If your org is limited to 1 image/min, set this to ~65s.
const MIN_DELAY_MS = Number(process.env.IMAGE_MIN_DELAY_MS || 65000);
const MAX_RETRIES = Number(process.env.IMAGE_MAX_RETRIES || 8);

const cardsMod = await import(path.resolve('./cards.js'));
const deck = cardsMod.STARTER_DECK;

fs.mkdirSync('assets/cards', { recursive: true });

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function requestImage(prompt) {
  // NOTE: some Images API variants reject `response_format`; by default
  // this endpoint commonly returns `b64_json` in `data[0]`.
  const body = {
    model: MODEL,
    prompt,
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

  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch { json = null; }

  if (!res.ok) {
    const msg = json?.error?.message || txt.slice(0, 300);
    const err = new Error(`HTTP ${res.status}: ${msg}`);
    err.status = res.status;
    err.raw = txt;
    throw err;
  }

  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`No b64_json in response. Keys: ${Object.keys(json||{}).join(',')}`);
  }

  return Buffer.from(b64, 'base64');
}

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

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const buf = await requestImage(card.artPrompt);
      fs.writeFileSync(outPath, buf);
      console.log('wrote', outPath);
      // Respect low RPM limits.
      await sleep(MIN_DELAY_MS);
      return;
    } catch (e) {
      if (e?.status === 429 && attempt < MAX_RETRIES) {
        const wait = MIN_DELAY_MS + attempt * 10000;
        console.log(`rate-limited (429). waiting ${Math.round(wait/1000)}s then retrying: ${card.id}`);
        await sleep(wait);
        continue;
      }
      throw e;
    }
  }
}

for (const card of deck) {
  await genOne(card);
}
