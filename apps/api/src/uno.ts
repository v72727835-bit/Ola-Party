// UNO for 2-4 players (people or computer players) inside a room.
// Hands and the draw pile are kept outside the public game object so nobody can see other hands.
import { z } from 'zod';
type Row = Record<string, any>;
export type Card = { id: string; color: string; value: string };
export const UNO_COLORS = ['red', 'yellow', 'green', 'blue'] as const;

export function newDeck(): Card[] {
  const d: Card[] = []; let n = 0; const add = (color: string, value: string) => d.push({ id: `c${n++}`, color, value });
  for (const col of UNO_COLORS) { add(col, '0'); for (let k = 0; k < 2; k++) { for (let v = 1; v <= 9; v++) add(col, String(v)); add(col, 'skip'); add(col, 'reverse'); add(col, 'draw2'); } }
  for (let k = 0; k < 4; k++) { add('wild', 'wild'); add('wild', 'wild4'); }
  return d;
}
export const shuffle = <T,>(a: T[], rnd = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const playable = (card: Card, top: Card, color: string) => card.color === 'wild' || card.color === color || card.value === top.value;

export function unoEngine(state: Row) {
  state.unoPrivate ??= {};
  const priv = (g: Row) => state.unoPrivate[g.id];
  const nameOf = (g: Row, id: string) => g.bots?.[id]?.name || state.users.find((u: Row) => u.id === id)?.name || 'Player';
  const step = (g: Row, k = 1) => { const n = g.playerIds.length; const i = g.playerIds.indexOf(g.turn); return g.playerIds[((i + g.direction * k) % n + n * 4) % n]; };
  const sync = (g: Row) => { const p = priv(g); g.counts = Object.fromEntries(g.playerIds.map((id: string) => [id, p.hands[id].length])); g.deckCount = p.deck.length; };
  const log = (g: Row, text: string) => { g.log = [text, ...(g.log || [])].slice(0, 6); };
  const draw = (g: Row, id: string, k: number) => { const p = priv(g); const got: Card[] = []; for (let i = 0; i < k; i++) { if (!p.deck.length) { p.deck = shuffle(p.discard.splice(0, p.discard.length - 1)); } const c = p.deck.pop(); if (c) { p.hands[id].push(c); got.push(c); } } return got; };

  function start(g: Row) {
    const deck = shuffle(newDeck()); const hands: Record<string, Card[]> = {};
    for (const id of g.playerIds) hands[id] = deck.splice(-7);
    let top = deck.pop()!; while (top.color === 'wild' || !/^\d$/.test(top.value)) { deck.unshift(top); top = deck.pop()!; }
    state.unoPrivate[g.id] = { deck, hands, discard: [top] };
    Object.assign(g, { status: 'playing', top, color: top.color, direction: 1, turn: g.playerIds[0], phase: 'play', drawnId: null }); log(g, 'Game started. Match the colour or the number.'); sync(g);
  }
  function play(g: Row, id: string, cardId: string, chosen?: string) {
    const p = priv(g); const hand: Card[] = p.hands[id]; const card = hand.find(c => c.id === cardId);
    if (!card) throw new Error('NO_CARD'); if (g.phase === 'drawn' && g.drawnId !== cardId) throw new Error('ONLY_DRAWN'); if (!playable(card, g.top, g.color)) throw new Error('NOT_PLAYABLE');
    if (card.color === 'wild' && !UNO_COLORS.includes(chosen as any)) throw new Error('CHOOSE_COLOR');
    hand.splice(hand.indexOf(card), 1); p.discard.push(card); g.top = card; g.color = card.color === 'wild' ? chosen : card.color; g.phase = 'play'; g.drawnId = null;
    const who = nameOf(g, id); const label = card.color === 'wild' ? (card.value === 'wild4' ? `Wild +4 (${g.color})` : `Wild (${g.color})`) : `${card.color} ${card.value}`;
    if (!hand.length) { g.status = 'finished'; g.winnerId = id; g.phase = 'done'; log(g, `${who} played ${label} and won!`); sync(g); return; }
    let skip = 1;
    if (card.value === 'skip') skip = 2;
    else if (card.value === 'reverse') { g.direction *= -1; skip = g.playerIds.length === 2 ? 2 : 1; }
    else if (card.value === 'draw2') { const v = step(g); draw(g, v, 2); skip = 2; log(g, `${nameOf(g, v)} draws 2`); }
    else if (card.value === 'wild4') { const v = step(g); draw(g, v, 4); skip = 2; log(g, `${nameOf(g, v)} draws 4`); }
    log(g, `${who} played ${label}${hand.length === 1 ? ' - UNO!' : ''}`);
    g.turn = step(g, skip); sync(g);
  }
  function drawCard(g: Row, id: string) {
    const [c] = draw(g, id, 1); log(g, `${nameOf(g, id)} drew a card`);
    if (c && playable(c, g.top, g.color)) { g.phase = 'drawn'; g.drawnId = c.id; } else { g.turn = step(g); g.phase = 'play'; g.drawnId = null; }
    sync(g); return c;
  }
  function pass(g: Row) { g.turn = step(g); g.phase = 'play'; g.drawnId = null; sync(g); }
  function botMove(g: Row) {
    const id = g.turn; const hand: Card[] = priv(g).hands[id];
    const options = hand.filter(c => playable(c, g.top, g.color) && (g.phase !== 'drawn' || c.id === g.drawnId));
    if (!options.length) { if (g.phase === 'drawn') pass(g); else { const c = drawCard(g, id); if (c && g.phase === 'drawn') play(g, id, c.id, bestColor(hand)); } return; }
    const rank = (c: Card) => c.color === 'wild' ? (c.value === 'wild4' ? 1 : 2) : ['draw2', 'skip', 'reverse'].includes(c.value) ? 5 : 4;
    const pick = options.sort((a, b) => rank(b) - rank(a))[0]; play(g, id, pick.id, bestColor(hand));
  }
  const bestColor = (hand: Card[]) => { const count: Record<string, number> = {}; for (const c of hand) if (c.color !== 'wild') count[c.color] = (count[c.color] || 0) + 1; return (Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0]) || 'red'; };
  return { start, play, drawCard, pass, botMove, priv, sync };
}

export function registerUno(ctx: Row) {
  const { route, state, save, uid, now, fail, room, member, io, gameView } = ctx;
  state.games ??= []; const E = unoEngine(state); const timers = new Set<string>();
  const find = (id: string) => state.games.find((x: Row) => x.id === id && x.type === 'uno') || fail(404, 'NOT_FOUND', 'UNO game not found');
  const emit = (g: Row) => io.to('room:' + g.roomId).emit('game:updated', gameView(g));
  const done = (g: Row) => { save(); emit(g); scheduleBot(g); };
  const guard = (fn: () => void) => { try { fn(); } catch (e: any) { const map: Record<string, string> = { NO_CARD: 'You do not have that card', ONLY_DRAWN: 'Play the card you drew or pass', NOT_PLAYABLE: 'That card does not match', CHOOSE_COLOR: 'Choose a colour for the wild card' }; if (map[e.message]) fail(409, e.message, map[e.message]); throw e; } };
  function scheduleBot(g: Row) {
    if (g.status !== 'playing' || !g.bots?.[g.turn] || timers.has(g.id)) return; timers.add(g.id);
    const t = setTimeout(() => { timers.delete(g.id); if (g.status === 'playing' && g.bots?.[g.turn] && E.priv(g)) { E.botMove(g); done(g); } }, 1300); t.unref?.();
  }
  for (const g of state.games) if (g.type === 'uno' && E.priv(g)) scheduleBot(g);
  const turnCheck = (g: Row, u: Row) => { member(room(g.roomId), u); if (g.status !== 'playing' || g.turn !== u.id) fail(409, 'INVALID_TURN', 'Wait for your turn'); };

  route('post', '/games/uno', (req: any, u: Row) => {
    const { roomId } = z.object({ roomId: z.string() }).parse(req.body); member(room(roomId), u);
    const g = { id: uid(), type: 'uno', roomId, hostId: u.id, playerIds: [u.id], bots: {}, status: 'waiting', winnerId: null, log: [], createdAt: now() };
    state.games.push(g); save(); emit(g); return gameView(g);
  });
  route('post', '/games/:id/uno-join', (req: any, u: Row) => {
    const g = find(req.params.id); member(room(g.roomId), u); if (g.playerIds.includes(u.id)) return gameView(g);
    if (g.status !== 'waiting') fail(409, 'GAME_STARTED', 'Game already started'); if (g.playerIds.length >= 4) fail(409, 'GAME_FULL', 'Game is full');
    g.playerIds.push(u.id); save(); emit(g); return gameView(g);
  });
  route('post', '/games/:id/uno-bot', (req: any, u: Row) => {
    const g = find(req.params.id); if (g.hostId !== u.id) fail(403, 'HOST_ONLY', 'Only the game host can add computer players');
    if (g.status !== 'waiting') fail(409, 'GAME_STARTED', 'Game already started'); if (g.playerIds.length >= 4) fail(409, 'GAME_FULL', 'Game is full');
    const id = 'bot-' + uid().slice(0, 8); g.bots[id] = { id, name: `Computer ${Object.keys(g.bots).length + 1}`, photo: '', level: 1, bot: true }; g.playerIds.push(id); save(); emit(g); return gameView(g);
  });
  route('post', '/games/:id/uno-start', (req: any, u: Row) => {
    const g = find(req.params.id); if (g.hostId !== u.id) fail(403, 'HOST_ONLY', 'Only the game host can start');
    if (g.status !== 'waiting') fail(409, 'GAME_STARTED', 'Game already started'); if (g.playerIds.length < 2) fail(409, 'NEED_PLAYERS', 'Need at least 2 players');
    E.start(g); done(g); return gameView(g);
  });
  route('get', '/games/:id/uno-hand', (req: any, u: Row) => {
    const g = find(req.params.id); const p = E.priv(g); const hand = p?.hands?.[u.id] || [];
    return { cards: hand, playable: g.status === 'playing' && g.turn === u.id ? hand.filter((c: Row) => (c.color === 'wild' || c.color === g.color || c.value === g.top.value) && (g.phase !== 'drawn' || c.id === g.drawnId)).map((c: Row) => c.id) : [] };
  });
  route('post', '/games/:id/uno-play', (req: any, u: Row) => {
    const { card, color } = z.object({ card: z.string(), color: z.enum(['red', 'yellow', 'green', 'blue']).optional() }).parse(req.body);
    const g = find(req.params.id); turnCheck(g, u); guard(() => E.play(g, u.id, card, color)); done(g); return gameView(g);
  });
  route('post', '/games/:id/uno-draw', (req: any, u: Row) => {
    const g = find(req.params.id); turnCheck(g, u); if (g.phase !== 'play') fail(409, 'ALREADY_DREW', 'Play the drawn card or pass'); E.drawCard(g, u.id); done(g); return gameView(g);
  });
  route('post', '/games/:id/uno-pass', (req: any, u: Row) => {
    const g = find(req.params.id); turnCheck(g, u); if (g.phase !== 'drawn') fail(409, 'DRAW_FIRST', 'Draw a card first'); E.pass(g); done(g); return gameView(g);
  });
}
