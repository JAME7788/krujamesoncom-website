import { useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { recordGameProgress } from '../services/gameProgressService';
import type { GameProgressId } from '../services/gameProgressService';

export const useGameProgress = (gameId: GameProgressId, gameTitle: string) => {
  const { user, partner } = useAuth();
  const toast = useToast();
  const recordedRef = useRef(false);

  return useCallback(
    async (score?: number) => {
      if (recordedRef.current || !user || user.id === 'admin_teacher_account') return;
      recordedRef.current = true;
      try {
        const result = await recordGameProgress(gameId, gameTitle, [user, partner], score);
        if (result.saved > 0) {
          toast.show(
            `บันทึกคะแนนกิจกรรมเกมแล้ว${partner ? ' ให้ทั้ง 2 คน' : ''}`,
            'success'
          );
        }
      } catch (e) {
        recordedRef.current = false;
        console.warn('Game progress save failed', e);
        toast.show('บันทึกคะแนนเกมไม่สำเร็จ ระบบจะลองใหม่เมื่อเล่นอีกครั้ง', 'error');
      }
    },
    [gameId, gameTitle, partner, toast, user]
  );
};
