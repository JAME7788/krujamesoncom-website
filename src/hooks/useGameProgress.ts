import { useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { recordGameProgress } from '../services/gameProgressService';
import type { GameProgressId } from '../services/gameProgressService';
import { celebrate } from '../utils/celebrate';
import { addCoins, coinsForGameScore } from '../services/coinService';
import { isScoreEligibleUser } from '../services/userAccessService';
import { retryGameSave } from '../utils/retryGameSave';

type GameProgressOptions = {
  recordOnce?: boolean;
};

export const useGameProgress = (
  gameId: GameProgressId,
  gameTitle: string,
  options: GameProgressOptions = {},
) => {
  const { user, partner } = useAuth();
  const { show: showToast } = useToast();
  const recordedRef = useRef(new Set<string>());
  const recordOnce = options.recordOnce ?? true;

  return useCallback(
    async (score?: number, activityKey?: string, maxScore?: number) => {
      const scoringPartner = isScoreEligibleUser(partner) ? partner : null;
      const completionKey = JSON.stringify([user?.id, scoringPartner?.id, gameId, activityKey?.trim() || 'complete']);
      if (recordOnce && recordedRef.current.has(completionKey)) return;
      if (recordOnce) recordedRef.current.add(completionKey);
      celebrate();
      if (!isScoreEligibleUser(user)) return;
      try {
        const result = await retryGameSave(() => recordGameProgress(
          gameId,
          gameTitle,
          [user, scoringPartner],
          score,
          activityKey,
          maxScore,
        ));
        if (result.saved > 0) {
          const earned = coinsForGameScore(score);
          addCoins(earned, user.id);
          showToast(`🪙 ได้ ${earned} เหรียญ ไปสะสมซื้อตัวละครได้`, 'info');
          showToast(
            `บันทึกคะแนนกิจกรรมเกมแล้ว${result.students === 2 ? ' ให้ทั้ง 2 คน' : ''}`,
            'success'
          );
        } else {
          recordedRef.current.delete(completionKey);
          showToast('กิจกรรมนี้ยังไม่ผูกกับวิชาที่เปิดให้ชั้นเรียน จึงยังไม่บันทึกคะแนน', 'info');
        }
      } catch (e) {
        if (recordOnce) recordedRef.current.delete(completionKey);
        console.warn('Game progress save failed', e);
        showToast('ยังส่งคะแนนให้ครูไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วเล่นกิจกรรมนี้อีกครั้ง', 'error');
      }
    },
    [gameId, gameTitle, partner, recordOnce, showToast, user]
  );
};
