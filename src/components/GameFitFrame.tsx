import { useEffect, useRef, type ReactNode } from 'react';
import './GameFitFrame.css';

/**
 * กรอบเกม: เลื่อนจอให้เกมอยู่ใต้แถบเมนูทันทีที่เริ่มเล่น
 * ความพอดีจอมาจากเลย์เอาต์ของแต่ละเกม (GameFitFrame.css) — ไม่ใช้ CSS zoom
 * เพราะ zoom ทำให้พิกัดเมาส์ (offsetX, การลากวาง) ของบางเกมคลาดเคลื่อน
 */
const NAV_OFFSET = 84; // ความสูงแถบเมนูด้านบน + ระยะหายใจ

export default function GameFitFrame({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const timer = window.setTimeout(() => {
      const top = outer.getBoundingClientRect().top + window.scrollY - NAV_OFFSET + 4;
      window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div ref={outerRef} className="game-fit-frame">
      <div className="game-fit-inner">{children}</div>
    </div>
  );
}
