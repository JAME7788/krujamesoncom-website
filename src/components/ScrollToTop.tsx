import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** เลื่อนกลับขึ้นบนสุดทุกครั้งที่เปลี่ยนหน้า */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
};

export default ScrollToTop;
