import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowUpRight, BookOpen, Gamepad2, Library } from 'lucide-react';
import { search } from '../services/searchService';
import type { SearchResult } from '../services/searchService';
import './SearchBar.css';

const SearchBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();

  const results = React.useMemo(() => {
    if (query.trim().length >= 2) {
      return search(query, 12);
    }
    return [];
  }, [query]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) dialogRef.current?.querySelector('.search-result.active')?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  // Keyboard shortcut Ctrl/Cmd + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleNav = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, Math.min(results.length - 1, i + 1)));
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
      <button className="search-trigger" onClick={() => setOpen(true)} title="ค้นหา (Ctrl+K)" aria-haspopup="dialog">
        <Search size={18} />
        <span className="search-hint">ค้นหา...</span>
        <kbd className="search-kbd">Ctrl K</kbd>
      </button>

      <dialog ref={dialogRef} className="search-dialog" aria-label="ค้นหาในห้องเรียน" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="search-modal">
            <div className="search-heading"><strong>ค้นหาในห้องเรียน</strong><span>บทเรียน · สื่อ · เกม</span></div>
            <div className="search-input-wrap">
              <Search size={20} />
              <input
                ref={inputRef}
                type="text"
                aria-label="คำค้น"
                aria-controls="portal-search-results"
                placeholder="ค้นหา หน่วย, ตัวชี้วัด, เกม, ลิงก์เรียน..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
                onKeyDown={handleNav}
              />
              <button className="search-close" onClick={() => setOpen(false)} aria-label="ปิดการค้นหา">
                <X size={18} />
              </button>
            </div>

            {query.trim().length < 2 && (
              <div className="search-destinations">
                {[{ title: 'คอร์สเรียน', url: '/courses', Icon: BookOpen }, { title: 'เกมและกิจกรรม', url: '/games', Icon: Gamepad2 }, { title: 'แหล่งเรียนรู้', url: '/resources', Icon: Library }].map(({ title, url, Icon }) => <button type="button" key={url} onClick={() => { navigate(url); setOpen(false); setQuery(''); }}><Icon size={21} /><span>{title}</span><ArrowUpRight size={18} /></button>)}
              </div>
            )}

            {query.trim().length >= 2 && results.length === 0 && (
              <div className="search-empty" role="status">ไม่พบผลการค้นหา “{query}”</div>
            )}

            {results.length > 0 && (
              <div className="search-results" id="portal-search-results">
                <div className="search-meta" role="status">{results.length} ผลลัพธ์</div>
                {results.map((r, i) => (
                  <button
                    key={`${r.url}-${r.title}`}
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
      </dialog>
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
