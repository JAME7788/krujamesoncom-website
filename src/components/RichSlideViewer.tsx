import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { RichSlide } from '../data/richSlides';
import TTSButton from './TTSButton';

const themeColors: Record<string, { bg: string; accent: string; text: string }> = {
  blue:   { bg: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)', accent: '#3b82f6', text: '#1e3a8a' },
  green:  { bg: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)', accent: '#16a34a', text: '#14532d' },
  orange: { bg: 'linear-gradient(135deg, #ffedd5 0%, #fef3c7 100%)', accent: '#ea580c', text: '#7c2d12' },
  purple: { bg: 'linear-gradient(135deg, #ede9fe 0%, #f3e8ff 100%)', accent: '#7c3aed', text: '#4c1d95' },
  pink:   { bg: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)', accent: '#db2777', text: '#831843' },
  yellow: { bg: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)', accent: '#d97706', text: '#78350f' },
  red:    { bg: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)', accent: '#dc2626', text: '#7f1d1d' },
};

const calloutStyle = {
  tip:   { bg: '#dbeafe', border: '#3b82f6', icon: '💡', label: 'เคล็ดลับ' },
  warn:  { bg: '#fef3c7', border: '#f59e0b', icon: '⚠️', label: 'ข้อควรระวัง' },
  fun:   { bg: '#fce7f3', border: '#ec4899', icon: '🎉', label: 'สนุกมั้ย?' },
  quote: { bg: '#f3f4f6', border: '#6b7280', icon: '💬', label: 'คำคม' },
};

interface Props {
  slide: RichSlide;
  current: number;
  total: number;
}

const formatMarkdownInline = (text: string | undefined): { __html: string } => {
  if (!text) return { __html: '' };
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const formatted = escaped
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="inline-code" style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>');

  return { __html: formatted };
};

const RichSlideViewer: React.FC<Props> = ({ slide, current, total }) => {
  const theme = themeColors[slide.theme || 'blue'];
  const [quickChoiceState, setQuickChoiceState] = useState<{ slide: number; choice: number } | null>(null);
  const [showTeacherGuide, setShowTeacherGuide] = useState(false);
  const selectedQuickChoice = quickChoiceState?.slide === current ? quickChoiceState.choice : null;
  const displayTitle = slide.emoji && slide.title.trim().startsWith(slide.emoji)
    ? slide.title.trim().slice(slide.emoji.length).trim()
    : slide.title;
  const speechText = useMemo(() => [
    displayTitle,
    slide.body,
    ...(slide.bullets || []).flatMap((bullet) => [bullet.text, bullet.sub]),
    slide.callout?.text,
  ].filter(Boolean).join('. '), [displayTitle, slide]);

  return (
    <motion.div
      key={current}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className={`rich-slide ${slide.lessonArt ? 'has-lesson-art' : ''} ${slide.quickCheck ? 'has-quick-check' : ''}`}
      style={{ background: theme.bg, color: theme.text }}
    >
      <div className="rs-slide-toolbar">
        <div className="rs-toolbar-actions">
          <TTSButton text={speechText} label="ฟังหน้านี้" className="rs-tts-button" />
          {slide.teachingNote && (
            <button
              type="button"
              className={`rs-guide-toggle-btn ${showTeacherGuide ? 'active' : ''}`}
              onClick={() => setShowTeacherGuide((v) => !v)}
              title="แนวทางการสอนและคำถามชวนคิดสำหรับครูผู้สอน"
            >
              <span className="rs-guide-icon">📖</span>
              <span>{showTeacherGuide ? 'ปิดคู่มือครู' : 'คู่มือครู'}</span>
            </button>
          )}
        </div>
        <div className="rs-counter">{current + 1} / {total}</div>
      </div>

      {slide.lessonArt && !slide.image && (
        <div className="rs-lesson-art" aria-hidden="true">
          <img src={slide.lessonArt} alt="" loading="lazy" />
        </div>
      )}

      {/* COVER LAYOUT */}
      {slide.layout === 'cover' && (
        <div className={`rs-cover ${slide.image ? 'has-image' : ''}`}>
          {slide.image && (
            <div className="rs-image-cover">
              <img src={slide.image} alt={slide.imageCaption || displayTitle} loading="eager" />
              {slide.imageCaption && <div className="rs-caption">{slide.imageCaption}</div>}
            </div>
          )}
          <div className="rs-cover-copy">
            {slide.emoji && <div className="rs-emoji-huge">{slide.emoji}</div>}
            <h1 className="rs-title-huge">{displayTitle}</h1>
            {slide.body && <p className="rs-body-large" dangerouslySetInnerHTML={formatMarkdownInline(slide.body)} />}
          </div>
        </div>
      )}

      {/* SPLIT LAYOUT (text left, image right) */}
      {slide.layout === 'split' && (
        <div className="rs-split">
          <div className="rs-split-text">
            <h2 className="rs-title">{slide.emoji && <span>{slide.emoji} </span>}{displayTitle}</h2>
            {slide.body && <p className="rs-body" dangerouslySetInnerHTML={formatMarkdownInline(slide.body)} />}
            {slide.bullets && (
              <ul className="rs-bullets">
                {slide.bullets.map((b, i) => (
                  <li key={i}>
                    {b.emoji && <span className="rs-bullet-emoji">{b.emoji}</span>}
                    <span>
                      <strong dangerouslySetInnerHTML={formatMarkdownInline(b.text)} />
                      {b.sub && <small dangerouslySetInnerHTML={formatMarkdownInline(b.sub)} />}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {slide.image && (
            <div className="rs-split-image">
              <img src={slide.image} alt={slide.imageCaption || displayTitle} loading="lazy" />
              {slide.imageCaption && <div className="rs-caption">{slide.imageCaption}</div>}
            </div>
          )}
        </div>
      )}

      {/* COMPARISON LAYOUT (vs) */}
      {slide.layout === 'comparison' && slide.compareLeft && slide.compareRight && (
        <div className="rs-comparison-wrap">
          <h2 className="rs-title">{slide.emoji && <span>{slide.emoji} </span>}{displayTitle}</h2>
          <div className="rs-comparison">
            <div className="rs-compare-card" style={{ borderTopColor: slide.compareLeft.color }}>
              <div className="rs-compare-emoji">{slide.compareLeft.emoji}</div>
              <h3 style={{ color: slide.compareLeft.color }}>{slide.compareLeft.title}</h3>
              <ul>
                {slide.compareLeft.items.map((it, i) => <li key={i} dangerouslySetInnerHTML={formatMarkdownInline(it)} />)}
              </ul>
            </div>
            <div className="rs-compare-vs">VS</div>
            <div className="rs-compare-card" style={{ borderTopColor: slide.compareRight.color }}>
              <div className="rs-compare-emoji">{slide.compareRight.emoji}</div>
              <h3 style={{ color: slide.compareRight.color }}>{slide.compareRight.title}</h3>
              <ul>
                {slide.compareRight.items.map((it, i) => <li key={i} dangerouslySetInnerHTML={formatMarkdownInline(it)} />)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* QUOTE LAYOUT */}
      {slide.layout === 'quote' && (
        <div className="rs-quote">
          <div className="rs-quote-mark">"</div>
          <p dangerouslySetInnerHTML={formatMarkdownInline(slide.body)} />
          <div className="rs-quote-mark close">"</div>
        </div>
      )}

      {/* STANDARD LAYOUT (default) */}
      {(!slide.layout || slide.layout === 'standard') && (
        <div className="rs-standard">
          <h2 className="rs-title">
            {slide.emoji && <span className="rs-title-emoji">{slide.emoji}</span>}
            {displayTitle}
          </h2>
          {slide.body && <p className="rs-body" dangerouslySetInnerHTML={formatMarkdownInline(slide.body)} />}
          <div className={`rs-content-row ${slide.image ? 'has-image' : 'no-image'}`}>
            <div className="rs-content-text">
              {slide.bullets && (
                <ul className="rs-bullets">
                  {slide.bullets.map((b, i) => (
                    <li key={i}>
                      {b.emoji && <span className="rs-bullet-emoji">{b.emoji}</span>}
                      <span>
                        <strong dangerouslySetInnerHTML={formatMarkdownInline(b.text)} />
                        {b.sub && <small dangerouslySetInnerHTML={formatMarkdownInline(b.sub)} />}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {slide.code && (
                <pre className="rs-code">
                  <code>{slide.code.content}</code>
                </pre>
              )}
            </div>
            {slide.image && (
              <div className="rs-image-side">
                <img src={slide.image} alt={slide.imageCaption || displayTitle} loading="lazy" />
                {slide.imageCaption && <div className="rs-caption">{slide.imageCaption}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALLOUT — แสดงทุก layout */}
      {slide.callout && (
        <div
          className="rs-callout"
          style={{
            background: calloutStyle[slide.callout.type].bg,
            borderLeftColor: calloutStyle[slide.callout.type].border,
          }}
        >
          <span className="rs-callout-icon">
            {slide.callout.emoji || calloutStyle[slide.callout.type].icon}
          </span>
          <span dangerouslySetInnerHTML={formatMarkdownInline(slide.callout.text)} />
        </div>
      )}

      {slide.teachingNote && showTeacherGuide && (
        <div className="rs-teaching-guide">
          <div className="rs-teaching-guide-header">
            <span>📖 แนวทางการจัดกิจกรรมสำหรับครูผู้สอน</span>
          </div>
          <div className="rs-teaching-guide-main">
            <span className="rs-guide-label">อธิบายให้เข้าใจ</span>
            <p>{slide.teachingNote.explain}</p>
          </div>
          <div className="rs-teaching-guide-row">
            <div>
              <span className="rs-guide-label">ตัวอย่างใกล้ตัว</span>
              <p>{slide.teachingNote.example}</p>
            </div>
            <div>
              <span className="rs-guide-label">ชวนคิด</span>
              <p>{slide.teachingNote.prompt}</p>
            </div>
          </div>
          {slide.teachingNote.steps && slide.teachingNote.steps.length > 0 && (
            <div className="rs-guide-steps">
              <span className="rs-guide-label">ลงมือทำทีละขั้น</span>
              <ol>
                {slide.teachingNote.steps.map((step, index) => <li key={index}>{step}</li>)}
              </ol>
            </div>
          )}
          {slide.teachingNote.check && (
            <div className="rs-guide-check">
              <span className="rs-guide-check-icon">✓</span>
              <div>
                <span className="rs-guide-label">เช็กความเข้าใจ</span>
                <p>{slide.teachingNote.check}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {slide.quickCheck && (
        <div className="rs-quick-check">
          <div className="rs-quick-check-heading">
            <span>กิจกรรมสั้น</span>
            <strong>{slide.quickCheck.question}</strong>
          </div>
          <div className="rs-quick-choices">
            {slide.quickCheck.choices.map((choice, index) => {
              const isSelected = selectedQuickChoice === index;
              const isCorrect = index === slide.quickCheck!.answer;
              const stateClass = isSelected ? (isCorrect ? 'correct' : 'wrong') : '';
              return (
                <button
                  type="button"
                  className={stateClass}
                  key={`${choice}-${index}`}
                onClick={() => setQuickChoiceState({ slide: current, choice: index })}
                >
                  <span>{String.fromCharCode(65 + index)}</span>
                  {choice}
                </button>
              );
            })}
          </div>
          {selectedQuickChoice !== null && (
            <div
              className={`rs-quick-feedback ${selectedQuickChoice === slide.quickCheck.answer ? 'correct' : 'wrong'}`}
              aria-live="polite"
            >
              {selectedQuickChoice === slide.quickCheck.answer
                ? slide.quickCheck.feedback
                : 'ลองอีกครั้ง มองหาคำตอบที่มีเหตุผลและตรวจสอบผลได้'}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default RichSlideViewer;
