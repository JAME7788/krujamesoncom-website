export interface MemoryCard { symbol: string; flipped: boolean; matched: boolean }
export interface MemoryRound {
  id: number;
  cards: MemoryCard[];
  selected: number[];
  moves: number;
  matches: number;
  paused: boolean;
  phase: 'idle' | 'playing' | 'resolving' | 'complete';
}
export const emptyMemoryRound = (): MemoryRound => ({ id: 0, cards: [], selected: [], moves: 0, matches: 0, paused: false, phase: 'idle' });

export const createMemoryRound = (symbols: string[], id: number, random = Math.random): MemoryRound => {
  const deck = [...new Set(symbols)].flatMap((symbol) => [symbol, symbol]);
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return { ...emptyMemoryRound(), id, phase: deck.length ? 'playing' : 'idle', cards: deck.map((symbol) => ({ symbol, flipped: false, matched: false })) };
};

export type MemoryAction = { type: 'start'; round: MemoryRound } | { type: 'reset' } | { type: 'pause' }
  | { type: 'flip'; index: number } | { type: 'resolve'; roundId: number };

export const memoryReducer = (state: MemoryRound, action: MemoryAction): MemoryRound => {
  if (action.type === 'start') return action.round;
  if (action.type === 'reset') return emptyMemoryRound();
  if (action.type === 'pause') return state.phase === 'idle' || state.phase === 'complete' ? state : { ...state, paused: !state.paused };
  if (state.paused) return state;
  if (action.type === 'flip') {
    const card = state.cards[action.index];
    if (state.phase !== 'playing' || !card || card.flipped || card.matched) return state;
    const selected = [...state.selected, action.index];
    return { ...state, selected, phase: selected.length === 2 ? 'resolving' : 'playing',
      moves: state.moves + (selected.length === 2 ? 1 : 0),
      cards: state.cards.map((item, index) => index === action.index ? { ...item, flipped: true } : item) };
  }
  if (state.phase !== 'resolving' || state.id !== action.roundId || state.selected.length !== 2) return state;
  const [a, b] = state.selected;
  const matched = state.cards[a].symbol === state.cards[b].symbol;
  const matches = state.matches + (matched ? 1 : 0);
  return { ...state, selected: [], matches, phase: matches * 2 === state.cards.length ? 'complete' : 'playing',
    cards: state.cards.map((card, index) => index === a || index === b ? { ...card, flipped: matched, matched } : card) };
};
