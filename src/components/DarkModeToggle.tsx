import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../services/themeService';

const DarkModeToggle: React.FC = () => {
  const { theme, toggleMode } = useTheme();
  const isDark = theme.mode === 'dark' ||
    (theme.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      className="icon-btn"
      onClick={toggleMode}
      title={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default DarkModeToggle;
