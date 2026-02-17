import { STARTER_DECK, cloneCard, formatCost, canPay, pay, COLORS } from './cards.js';

// --- Simple game state ---
const MAX_BOARD = 7;

function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sumCost(cost) {
  return COLORS.reduce((s, c) => s + (cost?.[c] ?? 0), 0);
}

function deepCopy(x) { return JSON.parse(JSON.stringify(x)); }

function applyDamageToUnit(u, dmg) {
  // Returns damage that actually hit LIFE (HP) after Shield/Armour.
  const startHp = u.currentHp;

  // Shield absorbs first (wizard barrier). Armour absorbs next (knight plating).
  const sh = u.currentShield ?? (u.shield ?? 0);
  const shBlock = Math.min(sh, dmg);
  u.currentShield = sh - shBlock;
  dmg -= shBlock;

  const a = u.currentArmour ?? (u.armour ?? 0);
  const armBlock = Math.min(a, dmg);
  u.currentArmour = a - armBlock;
  dmg -= armBlock;

  u.currentHp -= dmg;

  return Math.max(0, startHp - u.currentHp);
}

function applyDamageToHero(owner, dmg) {
  const start = state[owner].hp;
  state[owner].hp -= dmg;
  return Math.max(0, start - state[owner].hp);
}

function unitEffectiveHp(u) {
  return (u.currentHp ?? u.hp) + (u.currentArmour ?? (u.armour ?? 0));
}

function makePlayer(name) {
  const deck = shuffle(Array.from({ length: 20 }, (_, i) => cloneCard(STARTER_DECK[i % STARTER_DECK.length])));
  return {
    name,
    hp: 30,
    deck,
    hand: [],
    board: [],
    maxMana: { R: 0, G: 0, B: 0 },
    mana: { R: 0, G: 0, B: 0 },
  };
}

let state;

// UI refs
const el = {
  playerHp: document.getElementById('playerHp'),
  enemyHp: document.getElementById('enemyHp'),
  playerMana: document.getElementById('playerMana'),
  enemyMana: document.getElementById('enemyMana'),
  turn: document.getElementById('turn'),
  phase: document.getElementById('phase'),
  hand: document.getElementById('hand'),
  playerBoard: document.getElementById('playerBoard'),
  enemyBoard: document.getElementById('enemyBoard'),
  log: document.getElementById('log'),
  actionBtn: document.getElementById('actionBtn'),
  endTurnBtn: document.getElementById('endTurnBtn'),
  restartBtn: document.getElementById('restartBtn'),
  enemyHero: document.getElementById('enemyHero'),
  playerHero: document.getElementById('playerHero'),
  enemyHeroHp: document.getElementById('enemyHeroHp'),
  playerHeroHp: document.getElementById('playerHeroHp'),
};

function phaseLabel() {
  if (state.phase === 'main') return 'MAIN';
  if (state.phase === 'combat-declare') return 'COMBAT: DECLARE';
  if (state.phase === 'combat-block') return 'COMBAT: BLOCK';
  if (state.phase === 'combat-resolve') return 'COMBAT: RESOLVE';
  return String(state.phase || '').toUpperCase();
}

function log(msg) {
  const line = document.createElement('div');
  line.textContent = msg;
  el.log.prepend(line);
}

function manaString(m) {
  return `R:${m.R} G:${m.G} B:${m.B}`;
}

function draw(p) {
  if (p.deck.length === 0) {
    p.hp -= 1; // fatigue (very simple)
    log(`${p.name} fatigues (-1).`);
    return;
  }
  if (p.hand.length >= 10) {
    p.deck.pop(); // burn
    return;
  }
  p.hand.push(p.deck.pop());
}

function startGame() {
  state = {
    turnN: 1,
    current: 'player', // 'player'|'enemy'
    phase: 'main',
    player: makePlayer('You'),
    enemy: makePlayer('Enemy'),
    selectedAttacker: null, // legacy (used for block UI selection)
    combat: null, // { attackers: [{owner, idx}], blocks: { [atkOwner:atkIdx]: {owner, idx} } }
  };

  // opening hands
  for (let i = 0; i < 3; i++) { draw(state.player); draw(state.enemy); }

  beginTurn('player');
  render();
  log('Game start. The arena awakens.');
}

function beginTurn(who) {
  state.current = who;
  state.phase = 'main';
  state.combat = null;
  const p = state[who];

  // increment max mana: rotate colors each turn for predictability
  const color = COLORS[(state.turnN - 1) % COLORS.length];
  p.maxMana[color] += 1;
  p.mana = deepCopy(p.maxMana);

  // draw
  draw(p);

  // refresh summoning sickness
  for (const u of p.board) {
    if (u.summoningSick) u.summoningSick = false;
    u.exhausted = false;
    // reset shields at start of owner's turn
    u.currentShield = u.shield ?? 0;
  }

  log(`${p.name} turn ${state.turnN} (${color}+1 mana).`);

  // enemy plays cards, then attacks; you block.
  if (who === 'enemy') {
    enemyMain();
    state.phase = 'combat-declare';
    state.combat = { attackers: [], blocks: {} };
    enemyDeclareAttackers();

    if (!state.combat.attackers.length) {
      log('Enemy has no attackers.');
      state.phase = 'main';
      state.combat = null;
      endTurn();
      return;
    }

    state.phase = 'combat-block';
    log('Enemy attacks. Click an attacker to select it, then click one of your units to block. Click the same attacker again to unselect. Re-click the same block pair to remove a block.');
    render();
  }
}

function endTurn() {
  if (isGameOver()) return;
  state.selectedAttacker = null;
  state.combat = null;
  state.phase = 'main';

  if (state.current === 'player') {
    state.current = 'enemy';
    beginTurn('enemy');
  } else {
    state.turnN += 1;
    state.current = 'player';
    beginTurn('player');
  }

  render();
}

function isGameOver() {
  if (state.player.hp <= 0 || state.enemy.hp <= 0) {
    const winner = state.player.hp <= 0 ? 'Enemy' : 'You';
    log(`Game over. Winner: ${winner}`);
    el.endTurnBtn.disabled = true;
    return true;
  }
  return false;
}

function playCard(owner, handIdx) {
  const p = state[owner];
  const card = p.hand[handIdx];
  if (!card) return;
  if (owner !== state.current) return;
  if (p.board.length >= MAX_BOARD) { log('Board is full.'); return; }
  if (!canPay(card.cost, p.mana)) return;

  p.mana = pay(card.cost, p.mana);
  p.hand.splice(handIdx, 1);

  const hasHaste = (card.keywords || []).includes('Haste');

  p.board.push({
    ...card,
    currentHp: card.hp,
    currentArmour: card.armour ?? 0,
    currentShield: card.shield ?? 0,
    summoningSick: !hasHaste,
    exhausted: true,
  });

  log(`${p.name} played ${card.name} (${formatCost(card.cost)}).`);
  render();
}

function selectAttacker(owner, boardIdx) {
  // combat-v2: during COMBAT: DECLARE this toggles attackers
  if (state.phase === 'combat-declare') {
    toggleAttacker(owner, boardIdx);
    return;
  }
}

function attackUnit(defOwner, defIdx) {
  const atk = state.selectedAttacker;
  if (!atk) return;
  const A = state[atk.owner].board[atk.idx];
  const D = state[defOwner].board[defIdx];
  if (!A || !D) return;

  // exchange damage (armour absorbs first)
  applyDamageToUnit(D, A.atk);
  applyDamageToUnit(A, D.atk);
  A.exhausted = true;
  state.selectedAttacker = null;

  log(`${state[atk.owner].name}'s ${A.name} attacks ${state[defOwner].name}'s ${D.name}.`);

  cleanupDead();
  render();
  isGameOver();
}

function attackHero(defOwner) {
  const atk = state.selectedAttacker;
  if (!atk) return;
  const A = state[atk.owner].board[atk.idx];
  if (!A) return;

  state[defOwner].hp -= A.atk;
  A.exhausted = true;
  state.selectedAttacker = null;

  log(`${state[atk.owner].name}'s ${A.name} hits ${state[defOwner].name} for ${A.atk}.`);

  render();
  isGameOver();
}

function cleanupDead() {
  for (const who of ['player', 'enemy']) {
    const p = state[who];
    const before = p.board.length;
    p.board = p.board.filter(u => u.currentHp > 0);
    const died = before - p.board.length;
    if (died > 0) log(`${p.name} lost ${died} unit(s).`);
  }
}

function ensureCombat() {
  if (!state.combat) state.combat = { attackers: [], blocks: {} };
}

function combatKey(attacker) {
  return attacker.owner + ':' + attacker.idx;
}

function toggleAttacker(owner, boardIdx) {
  if (owner !== state.current) return;
  if (state.phase !== 'combat-declare') return;

  const p = state[owner];
  const u = p.board[boardIdx];
  if (!u) return;
  if (u.summoningSick || u.exhausted) return;

  ensureCombat();
  const i = state.combat.attackers.findIndex(a => a.owner === owner && a.idx === boardIdx);
  if (i >= 0) state.combat.attackers.splice(i, 1);
  else state.combat.attackers.push({ owner, idx: boardIdx });

  render();
}

function setBlock(defOwner, defIdx, atkOwner, atkIdx) {
  if (state.phase !== 'combat-block') return;

  const def = state[defOwner];
  const blocker = def.board[defIdx];
  if (!blocker) return;
  if (blocker.summoningSick || blocker.exhausted) return;

  ensureCombat();
  const A = state[atkOwner].board[atkIdx];
  if (!A) return;

  // Flying: can only be blocked by Flying.
  const aFly = (A.keywords || []).includes('Flying');
  const bFly = (blocker.keywords || []).includes('Flying');
  if (aFly && !bFly) {
    log('Only Flying units can block Flying attackers.');
    return;
  }

  const key = atkOwner + ':' + atkIdx;

  // Toggle: clicking the same pairing again removes the block.
  const existing = state.combat.blocks[key];
  if (existing && existing.owner === defOwner && existing.idx === defIdx) {
    delete state.combat.blocks[key];
    render();
    return;
  }

  // One blocker can only block one attacker: remove it from any other assignment.
  for (const k of Object.keys(state.combat.blocks)) {
    const b = state.combat.blocks[k];
    if (b && b.owner === defOwner && b.idx === defIdx) {
      delete state.combat.blocks[k];
    }
  }

  state.combat.blocks[key] = { owner: defOwner, idx: defIdx };
  render();
}

function resolveCombat() {
  if (state.phase !== 'combat-resolve') return;
  ensureCombat();

  for (const atk of state.combat.attackers) {
    const A = state[atk.owner].board[atk.idx];
    if (!A || A.currentHp <= 0) continue;

    const key = combatKey(atk);
    const blkRef = state.combat.blocks[key];
    const aKeywords = A.keywords || [];
    const aLifesteal = aKeywords.includes('Lifesteal');

    // Guard rule refinement:
    // If defender has at least one *ready* Guard that can legally block this attacker,
    // then the attacker must be blocked (we auto-assign one if you forgot).
    const defOwner = atk.owner === 'player' ? 'enemy' : 'player';

    const guardBlockers = state[defOwner].board
      .map((u, idx) => ({ u, idx }))
      .filter(x => (x.u.keywords || []).includes('Guard') && x.u.currentHp > 0 && !x.u.summoningSick && !x.u.exhausted)
      .filter(x => {
        const aFly = (A.keywords || []).includes('Flying');
        const bFly = (x.u.keywords || []).includes('Flying');
        return !aFly || bFly;
      });

    let effectiveBlkRef = blkRef;
    if (!effectiveBlkRef && guardBlockers.length > 0) {
      // pick the first ready guard to block
      effectiveBlkRef = { owner: defOwner, idx: guardBlockers[0].idx };
      log(`Guard intercepts: ${state[defOwner].board[guardBlockers[0].idx].name} blocks ${A.name}.`);
    }

    if (effectiveBlkRef) {
      const D = state[effectiveBlkRef.owner].board[effectiveBlkRef.idx];
      if (D && D.currentHp > 0) {
        const dealtToDef = applyDamageToUnit(D, A.atk);
        applyDamageToUnit(A, D.atk);
        log(`${state[atk.owner].name}'s ${A.name} fights ${state[effectiveBlkRef.owner].name}'s ${D.name}.`);

        if (aLifesteal && dealtToDef > 0) {
          state[atk.owner].hp += dealtToDef;
          log(`${state[atk.owner].name} lifesteals ${dealtToDef}.`);
        }
      }
    } else {
      const dealt = applyDamageToHero(defOwner, A.atk);
      log(`${state[atk.owner].name}'s ${A.name} hits ${state[defOwner].name} for ${dealt}.`);
      if (aLifesteal && dealt > 0) {
        state[atk.owner].hp += dealt;
        log(`${state[atk.owner].name} lifesteals ${dealt}.`);
      }
    }

    A.exhausted = true;
  }

  cleanupDead();
  state.combat = null;
  state.phase = 'main';
  render();
  isGameOver();
}

function enemyDeclareAttackers() {
  ensureCombat();
  const enemy = state.enemy;
  const ready = enemy.board.map((u, idx) => ({ u, idx }))
    .filter(x => !x.u.summoningSick && !x.u.exhausted && x.u.currentHp > 0);
  state.combat.attackers = ready.map(x => ({ owner: 'enemy', idx: x.idx }));
}

function enemyMain() {
  const enemy = state.enemy;

  // main: play best affordable cards until can't
  let played = true;
  while (played) {
    played = false;
    if (enemy.board.length >= MAX_BOARD) break;

    // pick the highest "value" affordable: prefer higher total cost
    let bestIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < enemy.hand.length; i++) {
      const c = enemy.hand[i];
      if (!canPay(c.cost, enemy.mana)) continue;
      const score = sumCost(c.cost) * 10 + (c.atk * 2 + c.hp);
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    if (bestIdx >= 0) {
      playCard('enemy', bestIdx);
      played = true;
    }
  }
}

// --- Render ---

const KEYWORD_HELP = {
  Guard: 'Guard: must be blocked if able (enemy can\'t slip past while a ready guard can block).',
  Haste: 'Haste: this unit can attack the turn it\'s played (no summoning sickness).',
  Flying: 'Flying: can only be blocked by other Flying units.',
  Lifesteal: 'Lifesteal: damage dealt heals your hero by the same amount.',
};

function renderCard(card, opts) {
  const div = document.createElement('div');
  div.className = 'card';

  if (opts.disabled) div.classList.add('disabled');
  if (opts.selected) div.classList.add('selected');

  const badge = document.createElement('div');
  badge.className = 'badge';
  badge.textContent = opts.badgeText || '';
  if (opts.badgeKind) badge.classList.add(opts.badgeKind);
  div.appendChild(badge);

  if (card.art) {
    const img = document.createElement('img');
    img.className = 'card-art';
    img.src = card.art;
    img.alt = card.name + ' art';
    img.loading = 'lazy';
    div.appendChild(img);
  }

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = card.name;
  div.appendChild(name);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = `<span>Cost: ${formatCost(card.cost)}</span><span>${card.tribe ? card.tribe : opts.ownerLabel}</span>`;
  div.appendChild(meta);

  const keywords = card.keywords || [];
  if (keywords.length) {
    const k = document.createElement('div');
    k.className = 'keywords';

    // Render each keyword as a hoverable chip with a tooltip.
    for (const kw of keywords) {
      const chip = document.createElement('span');
      chip.className = 'kw';
      chip.textContent = kw;
      chip.title = KEYWORD_HELP[kw] || kw;
      k.appendChild(chip);
    }

    div.appendChild(k);
  }

  // corner stats (Phageborn-ish): ATK bottom-left, ARM bottom-right, LIFE top-right
  // plus SHIELD top-left (wizard barrier)
  const life = (card.currentHp ?? card.hp);
  const armour = (card.currentArmour ?? (card.armour ?? 0));
  const shield = (card.currentShield ?? (card.shield ?? 0));

  const lifePip = document.createElement('div');
  lifePip.className = 'pip pip-life';
  lifePip.textContent = String(life);
  div.appendChild(lifePip);

  const atkPip = document.createElement('div');
  atkPip.className = 'pip pip-atk';
  atkPip.textContent = String(card.atk);
  div.appendChild(atkPip);

  if (armour > 0) {
    const armPip = document.createElement('div');
    armPip.className = 'pip pip-arm';
    armPip.textContent = String(armour);
    div.appendChild(armPip);
  }

  if (shield > 0) {
    const shPip = document.createElement('div');
    shPip.className = 'pip pip-shield';
    shPip.textContent = String(shield);
    div.appendChild(shPip);
  }


  if (card.text) {
    const t = document.createElement('div');
    t.className = 'small';
    t.style.marginTop = '8px';
    t.textContent = card.text;
    div.appendChild(t);
  }

  return div;
}

function render() {
  const p = state.player;
  const e = state.enemy;

  el.playerHp.textContent = p.hp;
  el.enemyHp.textContent = e.hp;
  el.playerHeroHp.textContent = p.hp;
  el.enemyHeroHp.textContent = e.hp;

  el.playerMana.textContent = `${manaString(p.mana)} (max ${manaString(p.maxMana)})`;
  el.enemyMana.textContent = `${manaString(e.mana)} (max ${manaString(e.maxMana)})`;

  el.turn.textContent = state.turnN;
  el.phase.textContent = `${state.current.toUpperCase()} / ${phaseLabel()}`;

  // action button label
  if (state.phase === 'main') el.actionBtn.textContent = 'Combat';
  else if (state.phase === 'combat-declare') el.actionBtn.textContent = 'Confirm attackers';
  else if (state.phase === 'combat-block') el.actionBtn.textContent = 'Resolve blocks';
  else if (state.phase === 'combat-resolve') el.actionBtn.textContent = 'Resolve';
  else el.actionBtn.textContent = 'Next phase';

  // hand
  el.hand.innerHTML = '';
  p.hand.forEach((c, i) => {
    const disabled = state.current !== 'player' || !canPay(c.cost, p.mana) || p.board.length >= MAX_BOARD;
    const div = renderCard(c, { disabled, ownerLabel: 'Hand', badgeText: disabled ? 'Not playable' : 'Playable', badgeKind: disabled ? '' : 'ready' });
    div.addEventListener('click', () => { if (!disabled) playCard('player', i); });
    el.hand.appendChild(div);
  });

  // boards
  el.playerBoard.innerHTML = '';
  p.board.forEach((u, idx) => {
    const badgeText = u.summoningSick ? 'Sick' : (u.exhausted ? 'Used' : 'Ready');
    const badgeKind = u.summoningSick ? 'sick' : (!u.exhausted ? 'ready' : '');
    const attackerSelected = state.phase === 'combat-declare' && state.current === 'player' && state.combat?.attackers?.some(a => a.owner === 'player' && a.idx === idx);
    const selected = attackerSelected;
    const div = renderCard(u, { disabled: false, ownerLabel: 'Board', badgeText, badgeKind, selected });
    div.addEventListener('click', () => {
      if (state.phase === 'combat-block' && state.current === 'enemy') {
        const atk = state.selectedAttacker;
        if (atk) setBlock('player', idx, atk.owner, atk.idx);
        return;
      }
      selectAttacker('player', idx);
    });
    el.playerBoard.appendChild(div);
  });

  el.enemyBoard.innerHTML = '';
  e.board.forEach((u, idx) => {
    const badgeText = u.summoningSick ? 'Sick' : (u.exhausted ? 'Used' : 'Ready');
    const badgeKind = u.summoningSick ? 'sick' : (!u.exhausted ? 'ready' : '');
    const selected = state.phase === 'combat-block' && state.current === 'enemy' && state.selectedAttacker?.owner === 'enemy' && state.selectedAttacker?.idx === idx;
    const isBlocked = !!state.combat?.blocks?.['enemy:' + idx];
    const badgeOverride = (state.phase === 'combat-block' && state.current === 'enemy' && isBlocked) ? 'Blocked' : badgeText;
    const div = renderCard(u, { disabled: false, ownerLabel: 'Board', badgeText: badgeOverride, badgeKind, selected });
    div.addEventListener('click', () => {
      if (state.phase === 'combat-block' && state.current === 'enemy') {
        // toggle selecting this attacker; if already selected, unselect.
        if (state.selectedAttacker?.owner === 'enemy' && state.selectedAttacker?.idx === idx) state.selectedAttacker = null;
        else state.selectedAttacker = { owner: 'enemy', idx };
        render();
      }
    });
    el.enemyBoard.appendChild(div);
  });

  el.endTurnBtn.disabled = isGameOver();
}

function nextPhase() {
  if (isGameOver()) return;

  if (state.phase === 'main') {
    state.phase = 'combat-declare';
    state.combat = { attackers: [], blocks: {} };
    log(`${state[state.current].name} enters combat.`);
    render();
    return;
  }

  if (state.phase === 'combat-declare') {
    if (!state.combat || state.combat.attackers.length === 0) {
      log('No attackers declared.');
      state.phase = 'main';
      state.combat = null;
      render();
      return;
    }

    if (state.current === 'player') {
      // enemy auto-blocks (better): prioritize Guard blockers, then any legal blocker.
      const enemy = state.enemy;
      const blockers = enemy.board.map((u, idx) => ({ u, idx }))
        .filter(x => !x.u.summoningSick && !x.u.exhausted && x.u.currentHp > 0);

      const guards = blockers.filter(x => (x.u.keywords || []).includes('Guard'));
      const others = blockers.filter(x => !(x.u.keywords || []).includes('Guard'));

      function pickLegal(attacker, pool) {
        const A = state.player.board[attacker.idx];
        if (!A) return -1;
        const aFly = (A.keywords || []).includes('Flying');
        for (let i = 0; i < pool.length; i++) {
          const bFly = (pool[i].u.keywords || []).includes('Flying');
          if (!aFly || bFly) return i;
        }
        return -1;
      }

      for (const atk of state.combat.attackers) {
        let i = pickLegal(atk, guards);
        if (i < 0) i = pickLegal(atk, others);
        if (i < 0) continue;

        const chosen = (i >= 0 && i < guards.length) ? guards.splice(i, 1)[0] : others.splice(i, 1)[0];
        state.combat.blocks[atk.owner + ':' + atk.idx] = { owner: 'enemy', idx: chosen.idx };
      }

      state.phase = 'combat-resolve';
      render();
      nextPhase();
      return;
    }
  }

  if (state.phase === 'combat-block') {
    state.phase = 'combat-resolve';
    render();
    nextPhase();
    return;
  }

  if (state.phase === 'combat-resolve') {
    resolveCombat();
    return;
  }
}

el.actionBtn.addEventListener('click', () => nextPhase());

el.endTurnBtn.addEventListener('click', () => endTurn());
el.restartBtn.addEventListener('click', () => {
  el.endTurnBtn.disabled = false;
  el.log.innerHTML = '';
  startGame();
});

startGame();
