import { useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { recordGameProgress } from '../services/gameProgressService';
import type { GameProgressId } from '../services/gameProgressService';
import { celebrate } from '../utils/celebrate';

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
    async (score?: number) => {
      if (recordOnce && recordedRef.current) return;
      if (recordOnce) recordedRef.current = true;
      celebrate(); // 🎉 ฉลองทุกครั้งที่เล่นจบ (เสียง + confetti) — เด็กทุกคนรวม guest
      if (!user || user.id === 'admin_teacher_account') return;
      try {
        const result = await recordGameProgress(gameId, gameTitle, [user, partner], score);
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
