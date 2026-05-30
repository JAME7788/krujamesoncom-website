// Global Search — ค้นหาทุกอย่างในเว็บ
import { grades } from '../data/curriculum';
import { allResources } from '../data/learningResources';
import { unitExtras } from '../data/unitExtras';

export interface SearchResult {
  type: 'unit' | 'indicator' | 'resource' | 'topic' | 'lesson' | 'game';
  title: string;
  desc?: string;
  emoji?: string;
  url: string;
  context?: string; // ข้อความบริบท เช่น "ป.5 หน่วย 2"
  score: number;
}

const games = [
  { id: 'mouse-practice', title: 'ภารกิจเมาส์แม่นยำ', emoji: '🖱️' },
  { id: 'keyboard-practice', title: 'นักสำรวจคีย์บอร์ด', emoji: '⌨️' },
  { id: 'algorithm-sorter', title: 'จัดอัลกอริทึม', emoji: '🧩' },
  { id: 'binary', title: 'แปลงเลขฐานสอง', emoji: '🔢' },
  { id: 'memory', title: 'จับคู่ความจำ', emoji: '🃏' },
  { id: 'pattern', title: 'หาแพทเทิร์น', emoji: '🔍' },
  { id: 'coding-maze', title: 'Coding Maze', emoji: '🤖' },
  { id: 'snake', title: 'งูกินผลไม้', emoji: '🐍' },
  { id: 'bug-catcher', title: 'จับบั๊ก', emoji: '🐞' },
];

const score = (text: string, query: string): number => {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 50 + Math.max(0, 30 - Math.abs(t.length - q.length));
  return 0;
};

export const search = (query: string, limit = 30): SearchResult[] => {
  if (!query.trim() || query.trim().length < 2) return [];
  const results: SearchResult[] = [];

  // 1) Curriculum: grades, units, indicators, topics
  grades.forEach((g) => {
    const gScore = score(g.title, query);
    if (gScore > 0) {
      results.push({
        type: 'lesson', title: g.title, emoji: g.emoji,
        url: `/courses`, context: `ระดับชั้น`, score: gScore,
      });
    }

    g.units?.forEach((u) => {
      const uScore = score(u.title, query);
      if (uScore > 0) {
        results.push({
          type: 'unit', title: u.title, emoji: g.emoji,
          desc: u.topics?.slice(0, 2).join(' • '),
          url: `/curriculum/${g.id}/unit/${u.no}`,
          context: `${g.title} • หน่วย ${u.no}`,
          score: uScore,
        });
      }
      // Topics
      u.topics?.forEach((topic) => {
        const tScore = score(topic, query);
        if (tScore > 0) {
          results.push({
            type: 'topic', title: topic, emoji: '📌',
            url: `/curriculum/${g.id}/unit/${u.no}`,
            context: `${g.title} • ${u.title}`,
            score: tScore - 10,
          });
        }
      });
    });

    g.indicators.forEach((ind, i) => {
      const iScore = Math.max(score(ind.code, query), score(ind.text, query));
      if (iScore > 0) {
        results.push({
          type: 'indicator', title: ind.code, emoji: '🎯',
          desc: ind.text,
          url: `/curriculum/${g.id}/${i}`,
          context: g.title,
          score: iScore,
        });
      }
    });
  });

  // 2) Resources
  allResources.forEach((r) => {
    const rScore = Math.max(score(r.title, query), score(r.desc, query));
    if (rScore > 0) {
      results.push({
        type: 'resource', title: r.title, emoji: r.emoji,
        desc: r.desc,
        url: `/resources`,
        context: 'แหล่งเรียนรู้',
        score: rScore,
      });
    }
  });

  // 3) Games
  games.forEach((g) => {
    const gs = score(g.title, query);
    if (gs > 0) {
      results.push({
        type: 'game', title: g.title, emoji: g.emoji,
        url: `/games/${g.id}`,
        context: 'เกมฝึก',
        score: gs,
      });
    }
  });

  // 4) Articles in unitExtras
  Object.entries(unitExtras).forEach(([gradeId, units]) => {
    Object.entries(units).forEach(([unitNo, extras]) => {
      extras.articles?.forEach((a) => {
        const aScore = score(a.title, query);
        if (aScore > 0) {
          results.push({
            type: 'resource', title: a.title, emoji: '📰',
            desc: a.desc,
            url: `/curriculum/${gradeId}/unit/${unitNo}`,
            context: `บทความ • ${gradeId} หน่วย ${unitNo}`,
            score: aScore - 15,
          });
        }
      });
    });
  });

  // Dedupe by url+title
  const seen = new Set<string>();
  const unique = results.filter((r) => {
    const k = `${r.url}_${r.title}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  unique.sort((a, b) => b.score - a.score);
  return unique.slice(0, limit);
};
