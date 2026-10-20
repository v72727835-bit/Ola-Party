// Ludo for 2-4 players (people or computer players) inside a room.
// Token position: -1 = in the yard, 0..50 = main track (relative to the player's start),
// 51..55 = home column, 56 = reached home.
import { z } from 'zod';
type Row = Record<string, any>;

export const LUDO_COLORS = ['red', 'green', 'yellow', 'blue'] as const;
export const OFFSETS: Record<string, number> = { red: 0, green: 13, yellow: 26, blue: 39 };
export const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];
export const HOME = 56;
export const absoluteSquare = (color: string, progress: number) => (progress + OFFSETS[color]) % 52;
const COLOR_SETS: Record<number, string[]> = { 2: ['red', 'yellow'], 3: ['red', 'green', 'yellow'], 4: ['red', 'green', 'yellow', 'blue'] };

export function legalMoves(g: Row, playerId: string, dice: number): number[] {
  const tokens: number[] = g.tokens?.[playerId] || [];
  return tokens.map((pos, i) => ((pos === -1 && dice === 6) || (pos >= 0 && pos + dice <= HOME) ? i : -1)).filter(i => i >= 0);
}

export function applyMove(g: Row, playerId: string, token: number, dice: number) {
  const color = g.colors[playerId]; const tokens: number[] = g.tokens[playerId];
  const from = tokens[token]; const to = from === -1 ? 0 : from + dice; tokens[token] = to;
  let captured = false;
  if (to <= 50) {
    const square = absoluteSquare(color, to);
    if (!SAFE_SQUARES.includes(square)) {
      for (const other of g.playerIds as string[]) {
        if (other === playerId) continue;
        g.tokens[other] = g.tokens[other].map((p: number) => (p >= 0 && p <= 50 && absoluteSquare(g.colors[other], p) === square ? (captured = true, -1) : p));
      }
    }
  }
  return { from, to, captured, finished: to === HOME };
}

const nextPlayer = (g: Row) => { const i = g.playerIds.indexOf(g.turn); return g.playerIds[(i + 1) % g.playerIds.length]; };
const nameOf = (g: Row, id: string, users: Row[]) => g.bots?.[id]?.name || users.find(u => u.id === id)?.name || 'Player';

// Applies a roll for the current player. Returns the legal moves left to choose from (empty when the turn moved on).
export function doRoll(g: Row, dice: number, users: Row[] = []): number[] {
  g.dice = dice; g.sixes = dice === 6 ? (g.sixes || 0) + 1 : 0;
  const who = nameOf(g, g.turn, users);
  if (g.sixes === 3) { g.sixes = 0; g.log = [`${who} rolled three sixes and lost the turn`, ...(g.log || [])].slice(0, 6); g.turn = nextPlayer(g); g.phase = 'roll'; return []; }
  const moves = legalMoves(g, g.turn, dice);
  if (!moves.length) { g.log = [`${who} rolled ${dice}, no move`, ...(g.log || [])].slice(0, 6); if (dice !== 6) { g.turn = nextPlayer(g); g.sixes = 0; } g.phase = 'roll'; return []; }
  g.phase = 'move'; return moves;
}

export function doMove(g: Row, token: number, users: Row[] = []) {
  const id = g.turn; const r = applyMove(g, id, token, g.dice); const who = nameOf(g, id, users);
  g.lastMove = { playerId: id, token, dice: g.dice, from: r.from, to: r.to, captured: r.captured, at: Date.now() };
  g.log = [`${who} moved ${g.dice}${r.captured ? ' and captured a token' : ''}${r.finished ? ' and reached home' : ''}`, ...(g.log || [])].slice(0, 6);
  if (g.tokens[id].every((p: number) => p === HOME)) { g.status = 'finished'; g.winnerId = id; g.phase = 'done'; g.log = [`${who} won the game`, ...g.log].slice(0, 6); return r; }
  if (!(g.dice === 6 || r.captured || r.finished)) { g.turn = nextPlayer(g); g.sixes = 0; }
  g.phase = 'roll'; return r;
}

// Computer player: capture first, then reach home, then leave the yard, otherwise move the furthest token.
export function botChoice(g: Row, id: string, moves: number[]): number {
  const color = g.colors[id]; const tokens: number[] = g.tokens[id];
  const score = (i: number) => {
    const from = tokens[i]; const to = from === -1 ? 0 : from + g.dice;
    if (to <= 50 && !SAFE_SQUARES.includes(absoluteSquare(color, to))) { const sq = absoluteSquare(color, to); for (const o of g.playerIds) if (o !== id && g.tokens[o].some((p: number) => p >= 0 && p <= 50 && absoluteSquare(g.colors[o], p) === sq)) return 1000; }
    if (to === HOME) return 900; if (from === -1) return 800; if (to > 50) return 500 + to; if (SAFE_SQUARES.includes(absoluteSquare(color, to))) return 400 + to; return to;
  };
  return moves.slice().sort((a, b) => score(b) - score(a))[0];
}

export function registerLudo(ctx: Row) {
  const { route, state, save, uid, now, fail, room, member, io, gameView } = ctx;
  state.games ??= [];
  const timers = new Set<string>();
  const find = (id: string) => state.games.find((x: Row) => x.id === id && x.type === 'ludo') || fail(404, 'NOT_FOUND', 'Ludo game not found');
  const emit = (g: Row) => io.to('room:' + g.roomId).emit('game:updated', gameView(g));
  const roll = () => 1 + Math.floor(Math.random() * 6);
  const finishTurn = (g: Row) => { save(); emit(g); scheduleBot(g); };
  function scheduleBot(g: Row) {
    if (g.status !== 'playing' || !g.bots?.[g.turn] || timers.has(g.id)) return;
    timers.add(g.id);
    const t = setTimeout(() => {
      timers.delete(g.id); if (g.status !== 'playing' || !g.bots?.[g.turn]) return;
      if (g.phase === 'roll') { const moves = doRoll(g, roll(), state.users); save(); emit(g); if (moves.length) { timers.add(g.id); const t2 = setTimeout(() => { timers.delete(g.id); if (g.phase === 'move' && g.bots?.[g.turn]) { doMove(g, botChoice(g, g.turn, legalMoves(g, g.turn, g.dice)), state.users); } finishTurn(g); }, 900); t2.unref?.(); } else scheduleBot(g); }
      else if (g.phase === 'move') { doMove(g, botChoice(g, g.turn, legalMoves(g, g.turn, g.dice)), state.users); finishTurn(g); }
    }, 1100);
    t.unref?.();
  }
  for (const g of state.games) if (g.type === 'ludo') scheduleBot(g);

  route('post', '/games/ludo', (req: any, u: Row) => {
    const { roomId } = z.object({ roomId: z.string() }).parse(req.body); member(room(roomId), u);
    const g = { id: uid(), type: 'ludo', roomId, hostId: u.id, playerIds: [u.id], bots: {}, colors: {}, tokens: {}, turn: null, dice: null, sixes: 0, phase: 'lobby', status: 'waiting', winnerId: null, log: [], createdAt: now() };
    state.games.push(g); save(); emit(g); return gameView(g);
  });
  route('post', '/games/:id/ludo-join', (req: any, u: Row) => {
    const g = find(req.params.id); member(room(g.roomId), u);
    if (g.playerIds.includes(u.id)) return gameView(g);
    if (g.status !== 'waiting') fail(409, 'GAME_STARTED', 'Game already started'); if (g.playerIds.length >= 4) fail(409, 'GAME_FULL', 'Game is full');
    g.playerIds.push(u.id); save(); emit(g); return gameView(g);
  });
  route('post', '/games/:id/ludo-bot', (req: any, u: Row) => {
    const g = find(req.params.id); if (g.hostId !== u.id) fail(403, 'HOST_ONLY', 'Only the game host can add computer players');
    if (g.status !== 'waiting') fail(409, 'GAME_STARTED', 'Game already started'); if (g.playerIds.length >= 4) fail(409, 'GAME_FULL', 'Game is full');
    const id = 'bot-' + uid().slice(0, 8); const n = Object.keys(g.bots).length + 1;
    g.bots[id] = { id, name: `Computer ${n}`, photo: '', level: 1, bot: true }; g.playerIds.push(id); save(); emit(g); return gameView(g);
  });
  route('post', '/games/:id/ludo-start', (req: any, u: Row) => {
    const g = find(req.params.id); if (g.hostId !== u.id) fail(403, 'HOST_ONLY', 'Only the game host can start');
    if (g.status !== 'waiting') fail(409, 'GAME_STARTED', 'Game already started'); if (g.playerIds.length < 2) fail(409, 'NEED_PLAYERS', 'Need at least 2 players');
    const set = COLOR_SETS[g.playerIds.length];
    g.playerIds.forEach((id: string, i: number) => { g.colors[id] = set[i]; g.tokens[id] = [-1, -1, -1, -1]; });
    g.status = 'playing'; g.phase = 'roll'; g.turn = g.playerIds[0]; g.log = ['Game started. Roll a 6 to bring a token out.'];
    finishTurn(g); return gameView(g);
  });
  route('post', '/games/:id/roll', (req: any, u: Row) => {
    const g = find(req.params.id); member(room(g.roomId), u);
    if (g.status !== 'playing' || g.turn !== u.id) fail(409, 'INVALID_TURN', 'Wait for your turn'); if (g.phase !== 'roll') fail(409, 'MOVE_FIRST', 'Move a token first');
    const moves = doRoll(g, roll(), state.users);
    if (moves.length === 1) doMove(g, moves[0], state.users);
    finishTurn(g); return gameView(g);
  });
  route('post', '/games/:id/ludo-move', (req: any, u: Row) => {
    const { token } = z.object({ token: z.number().int().min(0).max(3) }).parse(req.body); const g = find(req.params.id); member(room(g.roomId), u);
    if (g.status !== 'playing' || g.turn !== u.id) fail(409, 'INVALID_TURN', 'Wait for your turn'); if (g.phase !== 'move') fail(409, 'ROLL_FIRST', 'Roll the dice first');
    if (!legalMoves(g, u.id, g.dice).includes(token)) fail(409, 'ILLEGAL_MOVE', 'That token cannot move');
    doMove(g, token, state.users); finishTurn(g); return gameView(g);
  });
}
