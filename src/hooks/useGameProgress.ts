import { useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { recordGameProgress } from '../services/gameProgressService';
import type { GameProgressId } from '../services/gameProgressService';
import { celebrate } from '../utils/celebrate';
import { addCoins, coinsForGameScore } from '../services/coinService';
import { isScoreEligibleUser } from '../services/userAccessService';

type GameProgressOptions = {
  recordOnce?: boolean;
};

export const useGameProgress = (
  gameId: GameProgressId,
  gameTitle: string,
  options: GameProgressOptions = {},
) => {
  const { user, partner } = useAuth();
  const toast = useToast();
  const recordedRef = useRef(false);
  const recordOnce = options.recordOnce ?? true;

  return useCallback(
    async (score?: number, activityKey?: string) => {
      celebrate(); // 🎉 ฉลองทุกครั้งที่เล่นจบ (เสียง + confetti) — เด็กทุกคนรวม guest
      if (!isScoreEligibleUser(user)) return;
      if (recordOnce && recordedRef.current) return;
      if (recordOnce) recordedRef.current = true;

      // 🪙 เหรียญสำหรับซื้อตัวละครในร้าน — ได้จากการเล่นจบเท่านั้น
      // ผูกกับ recordOnce เดียวกัน จึงกดรัว ๆ เพื่อปั๊มเหรียญไม่ได้
      const earned = coinsForGameScore(score);
      addCoins(earned, user.id);
      toast.show(`🪙 ได้ ${earned} เหรียญ ไปสะสมซื้อตัวละครได้`, 'info');
      try {
        const result = await recordGameProgress(
          gameId,
          gameTitle,
          [user, isScoreEligibleUser(partner) ? partner : null],
          score,
          activityKey,
        );
        if (result.saved > 0) {
          toast.show(
            `บันทึกคะแนนกิจกรรมเกมแล้ว${partner ? ' ให้ทั้ง 2 คน' : ''}`,
            'success'
          );
        }
      } catch (e) {
        if (recordOnce) recordedRef.current = false;
        console.warn('Game progress save failed', e);
        toast.show('บันทึกคะแนนเกมไม่สำเร็จ ระบบจะลองใหม่เมื่อเล่นอีกครั้ง', 'error');
      }
    },
    [gameId, gameTitle, partner, recordOnce, toast, user]
  );
};
