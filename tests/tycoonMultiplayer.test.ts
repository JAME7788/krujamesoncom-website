import { describe, expect, it } from 'vitest';
import {
  canStartTycoonRoom,
  generateTycoonRoomCode,
  orderedTycoonRoomPlayers,
  type TycoonRoom,
} from '../src/services/tycoonMultiplayerService';

const room = (ready: boolean[]): TycoonRoom => ({
  code: '123456',
  name: 'ห้องทดสอบ',
  passwordHash: 'hash',
  hostId: 'player-1',
  minutes: 10,
  maxPlayers: 4,
  status: 'lobby',
  players: ready.map((isReady, index) => ({
    id: `player-${index + 1}`,
    name: `ผู้เล่น ${index + 1}`,
    characterId: `character-${index + 1}`,
    colorIndex: index,
    ready: isReady,
    joinedAt: 100 + index,
  })),
  game: null,
  createdAt: 100,
  updatedAt: 100,
});

describe('tycoon multiplayer room rules', () => {
  it('generates a six-digit classroom code', () => {
    expect(generateTycoonRoomCode()).toMatch(/^\d{6}$/);
  });

  it('starts only after at least two players are ready', () => {
    expect(canStartTycoonRoom(room([true]))).toBe(false);
    expect(canStartTycoonRoom(room([true, false]))).toBe(false);
    expect(canStartTycoonRoom(room([true, true]))).toBe(true);
  });

  it('keeps room members in their assigned seat order', () => {
    const shuffled = room([true, true, true]);
    shuffled.players = [shuffled.players[2], shuffled.players[0], shuffled.players[1]];

    expect(orderedTycoonRoomPlayers(shuffled).map((player) => player.id)).toEqual([
      'player-1',
      'player-2',
      'player-3',
    ]);
  });
});
