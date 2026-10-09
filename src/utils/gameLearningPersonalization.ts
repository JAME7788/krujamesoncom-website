export interface GameLearningHistoryItem {
  gameId: string;
  challengeMode: boolean;
  questionAnswered: boolean;
}

export interface GameJourneyProfile {
  stage: 'first' | 'growing' | 'mastery';
  recommendedMode: 'foundation' | 'challenge';
  label: string;
  message: string;
  nextStep: string;
}

export const getGameJourneyProfile = (
  history: GameLearningHistoryItem[],
  gameId: string,
): GameJourneyProfile => {
  const completed = history.filter((item) => item.gameId === gameId && item.questionAnswered);
  const challengeCount = completed.filter((item) => item.challengeMode).length;

  if (completed.length === 0) {
    return {
      stage: 'first',
      recommendedMode: 'foundation',
      label: 'ภารกิจแรกของฉัน',
      message: 'เริ่มจากฝึกพื้นฐานเพื่อรู้กติกา แล้วค่อยเพิ่มความท้าทาย',
      nextStep: 'จบรอบแรกให้ครบ 3 ดาว',
    };
  }
  if (completed.length >= 3 && challengeCount >= 1) {
    return {
      stage: 'mastery',
      recommendedMode: 'challenge',
      label: 'นักสำรวจชำนาญ',
      message: `ผ่านการทบทวนเกมนี้แล้ว ${completed.length} ครั้ง ลองตั้งเป้าทำให้แม่นหรือเร็วขึ้น`,
      nextStep: 'อธิบายวิธีคิดให้เพื่อนหรือครูฟัง',
    };
  }
  return {
    stage: 'growing',
    recommendedMode: 'challenge',
    label: 'พร้อมก้าวต่อ',
    message: `มีร่องรอยการเรียนรู้แล้ว ${completed.length} ครั้ง ระบบแนะนำโหมดท้าทาย`,
    nextStep: 'ลองเปลี่ยนวิธีหนึ่งอย่างแล้วเปรียบเทียบผล',
  };
};

export const getLearningStarCount = (
  completed: boolean,
  correct: boolean,
  reflection: string,
): number => Number(completed) + Number(correct) + Number(reflection.trim().length > 0);

export const getReflectionPrompts = (level: string, challengeMode: boolean): string[] => {
  const isYoungLearner = /ป\.1|ป\.2|ป\.3|เด็กเล็ก/.test(level);
  if (isYoungLearner) {
    return challengeMode
      ? ['ฉันลองวิธีใหม่', 'ฉันสังเกตจุดที่ผิด', 'รอบหน้าจะวางแผนก่อน']
      : ['ฉันทำทีละขั้น', 'ฉันลองใหม่เมื่อผิด', 'รอบหน้าจะตั้งใจกว่าเดิม'];
  }
  return challengeMode
    ? ['ฉันเปรียบเทียบสองวิธี', 'ฉันใช้หลักฐานตัดสินใจ', 'รอบหน้าจะปรับกลยุทธ์']
    : ['ฉันแยกปัญหาเป็นขั้น', 'ฉันตรวจผลกับเป้าหมาย', 'รอบหน้าจะทดลองอีกวิธี'];
};
