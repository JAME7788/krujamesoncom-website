import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  canStartTycoonRoom,
  generateTycoonRoomCode,
  mergeDigitalCitySupportPlayers,
  mergeDigitalCitySupportSnapshot,
  orderedTycoonRoomPlayers,
  deserializeTycoonGameQuestion,
  serializeTycoonGameQuestion,
  type TycoonGameSnapshot,
  type TycoonPlayerState,
  type TycoonRoom,
} from '../src/services/tycoonMultiplayerService';

const serviceSource = readFileSync('src/services/tycoonMultiplayerService.ts', 'utf8');
const digitalCitySource = readFileSync('src/pages/games/DigitalCityQuestGame.tsx', 'utf8');

const room = (ready: boolean[]): TycoonRoom => ({
  code: '123456',
  name: 'ห้องทดสอบ',
  passwordHash: 'hash',
  hostId: 'player-1',
  minutes: 10,
  status: 'lobby',
  players: ready.map((isReady, index) => ({
    id: `player-${index + 1}`,
    name: `ผู้เล่น ${index + 1}`,
    characterId: `character-${index + 1}`,
    ready: isReady,
    joinedAt: 100 + index,
    lastSeenAt: 100 + index,
  })),
  game: null,
  createdAt: 100,
  updatedAt: 100,
});

const gamePlayer = (idx: number, overrides: Partial<TycoonPlayerState> = {}): TycoonPlayerState => ({
  idx,
  name: `ทีม ${idx + 1}`,
  characterId: `character-${idx + 1}`,
  pos: 8 + idx,
  money: 7_000,
  owned: [],
  levels: {},
  skip: 0,
  out: false,
  correct: 0,
  answered: 0,
  collaborationScore: 0,
  strategyScore: 0,
  shielded: false,
  ...overrides,
});

const gameSnapshot = (overrides: Partial<TycoonGameSnapshot> = {}): TycoonGameSnapshot => ({
  version: 100,
  updatedBy: 'player-1',
  variant: 'digital-city',
  turnSerial: 3,
  phase: 'question',
  players: [gamePlayer(0), gamePlayer(1)],
  turn: 0,
  dice: 4,
  isRolling: false,
  question: null,
  picked: null,
  chance: null,
  message: 'กำลังตอบคำถาม',
  buyTile: null,
  rentTile: null,
  rentOwner: null,
  pendingRent: 0,
  upgradeTile: null,
  finishReason: '',
  endsAt: 10_000,
  questionEndsAt: 5_000,
  usedQuestionIds: ['q-1'],
  ...overrides,
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

  it('requires Firebase confirmation instead of silently creating a one-device room', () => {
    expect(serviceSource).not.toContain('firestoreUnavailable');
    expect(serviceSource).not.toContain('saved locally only');
    expect(serviceSource).not.toContain('return { ok: true, room: local }');
    expect(serviceSource).toContain('ONLINE_CONNECTION_ERROR');
    expect(serviceSource.match(/runTransaction\(db/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it('serializes evidence table rows without Firestore nested arrays', () => {
    const question = {
      missionTitle: 'อ่านตาราง',
      table: {
        headers: ['อุปกรณ์', 'คะแนน'],
        rows: [['A', '8'], ['B', '5']],
      },
    };
    const serialized = serializeTycoonGameQuestion(question) as typeof question & {
      table: { rows: Array<{ cells: string[] }> };
    };

    expect(serialized.table.rows).toEqual([
      { cells: ['A', '8'] },
      { cells: ['B', '5'] },
    ]);
    expect(deserializeTycoonGameQuestion(serialized)).toEqual(question);
    expect(serviceSource).toContain('transaction.set(ref, serializeRoomForFirestore(');
  });

  it('rejects out-of-turn Digital City state writes and clears deleted room caches', () => {
    expect(serviceSource).toContain("throw new Error('turn-owner-only')");
    expect(serviceSource).toContain("if (room.variant === 'digital-city' && room.game && game.phase !== 'over')");
    expect(serviceSource).toContain('removeLocalRoom(cleanCode)');
    expect(serviceSource).toContain("onSyncMode?.('firebase')");
    expect(serviceSource).not.toContain('onChange(readLocalRoom(cleanCode));\n        return;');
  });

  it('merges support without replacing the active player position or economy state', () => {
    const local = [gamePlayer(0, { pos: 12, money: 5_400 }), gamePlayer(1)];
    const support = [
      gamePlayer(0, { pos: 2, money: 100, strategyScore: 4, shielded: true }),
      gamePlayer(1, { collaborationScore: 3 }),
    ];

    const merged = mergeDigitalCitySupportPlayers(local, support, 0);
    expect(merged[0]).toMatchObject({ pos: 12, money: 5_400, strategyScore: 4, shielded: true });
    expect(merged[1].collaborationScore).toBe(3);
  });

  it('keeps the active question state while applying support time and scores', () => {
    const active = gameSnapshot({ version: 200, questionEndsAt: 8_000 });
    const support = gameSnapshot({
      version: 201,
      updatedBy: 'player-2',
      questionEndsAt: 13_000,
      players: [gamePlayer(0, { strategyScore: 1 }), gamePlayer(1, { collaborationScore: 2 })],
      message: 'ข้อความเก่าจากผู้ช่วย',
      supportMessage: 'ทีม 2 ส่งเวลาเพิ่ม 5 วินาที',
    });

    const merged = mergeDigitalCitySupportSnapshot(active, support);
    expect(merged.questionEndsAt).toBe(13_000);
    expect(merged.message).toBe('กำลังตอบคำถาม');
    expect(merged.supportMessage).toBe('ทีม 2 ส่งเวลาเพิ่ม 5 วินาที');
    expect(merged.players[1].collaborationScore).toBe(2);

    const alreadyAnswered = mergeDigitalCitySupportSnapshot(
      gameSnapshot({ picked: 1, questionEndsAt: 8_000 }),
      support,
    );
    expect(alreadyAnswered.picked).toBe(1);
    expect(alreadyAnswered.questionEndsAt).toBe(8_000);
  });

  it('limits support to a live unanswered question and provides host cancellation', () => {
    expect(serviceSource).toContain("room.game.phase !== 'question'");
    expect(serviceSource).toContain('room.game.picked !== null');
    expect(serviceSource).toContain('room.game.questionEndsAt <= Date.now()');
    expect(serviceSource).toContain('export const cancelTycoonRoom');
    expect(serviceSource).toContain("finishReason: 'เจ้าของห้องยกเลิกการแข่งขัน'");
  });

  it('does not cancel the final landing-state publish when a rolling snapshot returns', () => {
    const publishEffect = digitalCitySource.slice(
      digitalCitySource.indexOf('!isOnlineGame || !onlineRoomCode'),
      digitalCitySource.indexOf('if (phase === \'setup\' || phase === \'over\')'),
    );
    expect(digitalCitySource).toContain('!isOnlineGame || !onlineRoomCode');
    expect(digitalCitySource).toContain('publishTycoonGame(\n        onlineRoomCode,');
    expect(digitalCitySource).toContain('if (attempt < 2)');
    expect(digitalCitySource).toContain('if (published) {');
    expect(digitalCitySource).toContain('onlineMembers[onlineRoom.game.turn]?.id');
    expect(publishEffect).toContain('!canPublishTurn');
    expect(publishEffect).not.toContain('!canTakeTurn');
    expect(publishEffect).not.toContain('applyingRemoteRef.current) return undefined');
    expect(publishEffect).not.toContain('multiplayerPlayerId, onlineRoom, phase, picked');
  });
});
