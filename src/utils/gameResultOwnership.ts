/** Online scores belong to the local seat, never the room winner or average. */
export const getFinishedPlayerResult = <T>(
  game: { phase: string; finishReason: string; players: T[] } | null | undefined,
  seat: number,
): T | undefined => {
  if (!game || game.phase !== 'over' || game.finishReason.includes('ยกเลิก')) return undefined;
  if (!Number.isInteger(seat) || seat < 0 || seat >= game.players.length) return undefined;
  return game.players[seat];
};
