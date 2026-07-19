import React from 'react';
import { motion } from 'framer-motion';
import type { RichSlide } from '../data/richSlides';

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

  return (
    <motion.div
      key={current}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="rich-slide"
      style={{ background: theme.bg, color: theme.text }}
    >
      <div className="rs-counter">{current + 1} / {total}</div>

      {/* COVER LAYOUT */}
      {slide.layout === 'cover' && (
        <div className="rs-cover">
          {slide.emoji && <div className="rs-emoji-huge">{slide.emoji}</div>}
          <h1 className="rs-title-huge">{slide.title}</h1>
          {slide.body && <p className="rs-body-large" dangerouslySetInnerHTML={formatMarkdownInline(slide.body)} />}
          {slide.image && (
            <div className="rs-image-cover">
              <img src={slide.image} alt={slide.imageCaption || slide.title} loading="lazy" />
              {slide.imageCaption && <div className="rs-caption">{slide.imageCaption}</div>}
            </div>
          )}
        </div>
      )}

      {/* SPLIT LAYOUT (text left, image right) */}
      {slide.layout === 'split' && (
        <div className="rs-split">
          <div className="rs-split-text">
            <h2 className="rs-title">{slide.emoji && <span>{slide.emoji} </span>}{slide.title}</h2>
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
              <img src={slide.image} alt={slide.imageCaption || slide.title} loading="lazy" />
              {slide.imageCaption && <div className="rs-caption">{slide.imageCaption}</div>}
            </div>
          )}
        </div>
      )}

      {/* COMPARISON LAYOUT (vs) */}
      {slide.layout === 'comparison' && slide.compareLeft && slide.compareRight && (
        <div className="rs-comparison-wrap">
          <h2 className="rs-title">{slide.emoji && <span>{slide.emoji} </span>}{slide.title}</h2>
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
            {slide.title}
          </h2>
          {slide.body && <p className="rs-body" dangerouslySetInnerHTML={formatMarkdownInline(slide.body)} />}
          <div className="rs-content-row">
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
                <img src={slide.image} alt={slide.imageCaption || slide.title} loading="lazy" />
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

      {slide.teachingNote && (
        <div className="rs-teaching-guide">
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
        </div>
      )}
    </motion.div>
  );
};

export default RichSlideViewer;
