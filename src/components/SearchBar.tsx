import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { search } from '../services/searchService';
import type { SearchResult } from '../services/searchService';
import './SearchBar.css';

const SearchBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length >= 2) {
      setResults(search(query, 12));
      setActiveIdx(0);
    } else {
      setResults([]);
    }
  }, [query]);

  // Keyboard shortcut Ctrl/Cmd + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleNav = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      go(results[activeIdx]);
    }
  };

  const go = (r: SearchResult) => {
    navigate(r.url);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <button className="search-trigger" onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }} title="ค้นหา (Ctrl+K)">
        <Search size={18} />
        <span className="search-hint">ค้นหา...</span>
        <kbd className="search-kbd">Ctrl K</kbd>
      </button>

      {open && createPortal(
        <div className="search-overlay" onClick={() => setOpen(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-input-wrap">
              <Search size={20} />
              <input
                ref={inputRef}
                type="text"
                placeholder="ค้นหา หน่วย, ตัวชี้วัด, เกม, ลิงก์เรียน..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleNav}
                autoFocus
              />
              <button className="search-close" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {query.trim().length < 2 && (
              <div className="search-empty">
                💡 พิมพ์อย่างน้อย 2 ตัวอักษร — ลอง: Scratch, AI, ป.5, ว 4.2 ฯลฯ
                <div style={{ marginTop: 12 }}>
                  <kbd>↑↓</kbd> เลื่อน • <kbd>↵</kbd> เปิด • <kbd>Esc</kbd> ปิด
                </div>
              </div>
            )}

            {query.trim().length >= 2 && results.length === 0 && (
              <div className="search-empty">😞 ไม่พบผลการค้นหา "{query}"</div>
            )}

            {results.length > 0 && (
              <div className="search-results">
                <div className="search-meta">พบ {results.length} ผลลัพธ์</div>
                {results.map((r, i) => (
                  <button
                    key={i}
                    className={`search-result ${i === activeIdx ? 'active' : ''}`}
                    onClick={() => go(r)}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    <span className="sr-emoji">{r.emoji}</span>
                    <div className="sr-info">
                      <div className="sr-title">{r.title}</div>
                      {r.desc && <div className="sr-desc">{r.desc}</div>}
                      {r.context && <div className="sr-context">{r.context}</div>}
                    </div>
                    <span className={`sr-type type-${r.type}`}>{labelOf(r.type)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const labelOf = (t: SearchResult['type']) => {
  const m: Record<SearchResult['type'], string> = {
    unit: 'หน่วย',
    indicator: 'ตัวชี้วัด',
    resource: 'แหล่งเรียนรู้',
    topic: 'หัวข้อ',
    lesson: 'คอร์ส',
    game: 'เกม',
  };
  return m[t];
};

export default SearchBar;
