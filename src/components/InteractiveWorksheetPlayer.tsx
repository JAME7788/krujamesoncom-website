import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  RotateCcw,
  Send,
  Sparkles,
  Lock,
  ArrowUp,
  ArrowDown,
  X,
  AlertCircle,
  Volume2,
  Square,
  BookOpen,
  Gamepad2,
} from 'lucide-react';
import { isTTSSupported, speak as speakTTS, stop as stopTTS } from '../services/ttsService';
import {
  encodeWorksheetSubmission,
  followupAnswerKey,
  getShuffledBlocks,
  getWorksheetMaxScores,
  gradeInteractiveWorksheet,
  validateWorksheetAnswers,
  type InteractiveWorksheetSpec,
  type WorksheetAnswerMap,
  type WorksheetBlockOrderItem,
  type WorksheetChoiceItem,
  type WorksheetFollowupItem,
  type WorksheetGradingResult,
  type WorksheetMatchGroupItem,
  type WorksheetShortAnswerItem,
  type WorksheetSubItemGrade,
} from '../utils/interactiveWorksheetEngine';
import './InteractiveWorksheetPlayer.css';

const THAI_CHOICE_LETTERS = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ'];

export interface InteractiveWorksheetPlayerProps {
  title: string;
  description?: string;
  spec: InteractiveWorksheetSpec;
  initialAnswers?: WorksheetAnswerMap;
  /** ถ้ามี draftStorageKey ระบบจะบันทึกคำตอบชั่วคราวลง localStorage อัตโนมัติ */
  draftStorageKey?: string;
  /** true เมื่อครูตรวจยืนยันคะแนนลง ปพ.5 แล้ว (ดูผลได้อย่างเดียว แก้ไม่ได้) */
  locked?: boolean;
  /** ผลคะแนนทางการจากครู (ถ้าตรวจแล้ว) */
  reviewedResult?: {
    score?: number;
    maxScore?: number;
    kScore?: number;
    pScore?: number;
    feedback?: string;
  };
  /** true = โหมดฝึกทำตามชั้นเรียน (ไม่สร้างรายการส่งเข้า ปพ.5) */
  practiceMode?: boolean;
  submitting?: boolean;
  onSubmit?: (
    encodedData: string,
    summaryComment: string,
    result: WorksheetGradingResult,
  ) => Promise<void> | void;
  onClose?: () => void;
}

const loadDraftAnswers = (key?: string): WorksheetAnswerMap | null => {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as WorksheetAnswerMap) : null;
  } catch {
    return null;
  }
};

const InteractiveWorksheetPlayer: React.FC<InteractiveWorksheetPlayerProps> = ({
  title,
  description,
  spec,
  initialAnswers,
  draftStorageKey,
  locked = false,
  reviewedResult,
  practiceMode = false,
  submitting = false,
  onSubmit,
  onClose,
}) => {
  const [answers, setAnswers] = useState<WorksheetAnswerMap>(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      return { ...initialAnswers };
    }
    return loadDraftAnswers(draftStorageKey) || {};
  });

  const [submittedResult, setSubmittedResult] = useState<WorksheetGradingResult | null>(() => {
    if ((locked || (initialAnswers && Object.keys(initialAnswers).length > 0)) && !practiceMode) {
      return gradeInteractiveWorksheet(spec, initialAnswers || {});
    }
    return null;
  });

  const [missingWarning, setMissingWarning] = useState<string[]>([]);
  const [selectedMatchChip, setSelectedMatchChip] = useState<{
    itemId: string;
    entryId: string;
  } | null>(null);
  const [dragOverBlockItem, setDragOverBlockItem] = useState<string | null>(null);
  const [dragOverBucket, setDragOverBucket] = useState<string | null>(null);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const ttsSupported = useMemo(() => isTTSSupported(), []);

  useEffect(() => () => stopTTS(), []);

  const toggleSpeak = (key: string, text: string) => {
    if (!ttsSupported) return;
    if (speakingKey === key) {
      stopTTS();
      setSpeakingKey(null);
      return;
    }
    setSpeakingKey(key);
    speakTTS(text, {
      rate: 0.94,
      onEnd: () => setSpeakingKey((cur) => (cur === key ? null : cur)),
    });
  };

  const renderSpeakBtn = (key: string, text: string, label = 'ฟังโจทย์') => {
    if (!ttsSupported) return null;
    const active = speakingKey === key;
    return (
      <button
        type="button"
        className={`iw-tts-btn ${active ? 'active' : ''}`}
        onClick={() => toggleSpeak(key, text)}
        title={active ? 'หยุดอ่านออกเสียง' : 'ให้ระบบอ่านโจทย์ออกเสียง (เหมาะกับ ป.1–ป.3)'}
      >
        {active ? <Square size={12} /> : <Volume2 size={13} />}
        <span>{active ? 'หยุด' : label}</span>
      </button>
    );
  };

  const isReviewMode = Boolean(submittedResult) || locked;
  const maxScores = useMemo(() => getWorksheetMaxScores(spec), [spec]);

  // คำนวณความคืบหน้าสดขณะทำ
  const liveProgress = useMemo(() => {
    const res = gradeInteractiveWorksheet(spec, answers);
    const pct = res.totalSubItems > 0 ? Math.round((res.answeredSubItems / res.totalSubItems) * 100) : 0;
    return {
      answered: res.answeredSubItems,
      total: res.totalSubItems,
      pct,
    };
  }, [spec, answers]);

  // Map detail by sub-item id สำหรับแสดงผลตรวจรายข้อ
  const detailById = useMemo(() => {
    const map = new Map<string, WorksheetSubItemGrade>();
    if (submittedResult) {
      submittedResult.details.forEach((d) => map.set(d.id, d));
    }
    return map;
  }, [submittedResult]);

  // Auto-save draft ลง localStorage ขณะยังไม่ได้ส่ง
  useEffect(() => {
    if (!draftStorageKey || isReviewMode) return;
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify(answers));
    } catch {
      // ignore quota error
    }
  }, [answers, draftStorageKey, isReviewMode]);

  const updateAnswer = (key: string, value: unknown) => {
    if (isReviewMode) return;
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (missingWarning.length > 0) {
      setMissingWarning([]);
    }
  };

  // --- Block Order Helpers ---
  const getPlacedBlocks = (itemId: string): string[] => {
    const raw = answers[itemId];
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
  };

  const addBlockToStack = (itemId: string, blockId: string, insertIndex?: number) => {
    if (isReviewMode) return;
    const current = getPlacedBlocks(itemId).filter((id) => id !== blockId);
    if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= current.length) {
      current.splice(insertIndex, 0, blockId);
    } else {
      current.push(blockId);
    }
    updateAnswer(itemId, current);
  };

  const removeBlockFromStack = (itemId: string, blockId: string) => {
    if (isReviewMode) return;
    const next = getPlacedBlocks(itemId).filter((id) => id !== blockId);
    updateAnswer(itemId, next);
  };

  const moveBlockInStack = (itemId: string, index: number, delta: -1 | 1) => {
    if (isReviewMode) return;
    const current = [...getPlacedBlocks(itemId)];
    const target = index + delta;
    if (target < 0 || target >= current.length) return;
    const [moved] = current.splice(index, 1);
    current.splice(target, 0, moved);
    updateAnswer(itemId, current);
  };

  // --- Match Group Helpers ---
  const getMatchMapping = (itemId: string): Record<string, string> => {
    const raw = answers[itemId];
    return raw && typeof raw === 'object' && !Array.isArray(raw)
      ? { ...(raw as Record<string, string>) }
      : {};
  };

  const assignMatchEntry = (itemId: string, entryId: string, groupId: string | null) => {
    if (isReviewMode) return;
    const next = getMatchMapping(itemId);
    if (!groupId) {
      delete next[entryId];
    } else {
      next[entryId] = groupId;
    }
    updateAnswer(itemId, next);
    setSelectedMatchChip(null);
  };

  // --- Submit ---
  const handleSubmitWorksheet = async () => {
    const check = validateWorksheetAnswers(spec, answers);
    if (!check.valid) {
      setMissingWarning(check.missingLabels);
      return;
    }
    setMissingWarning([]);

    const { encodedData, result, summaryComment } = encodeWorksheetSubmission(spec, answers);
    if (onSubmit) {
      await onSubmit(encodedData, summaryComment, result);
    }
    setSubmittedResult(result);
    if (draftStorageKey) {
      try {
        localStorage.removeItem(draftStorageKey);
      } catch {
        // ignore
      }
    }
  };

  const handleRetry = () => {
    if (locked) return;
    setSubmittedResult(null);
    setMissingWarning([]);
    setSelectedMatchChip(null);
  };

  const handleResetAll = () => {
    if (locked) return;
    setAnswers({});
    setSubmittedResult(null);
    setMissingWarning([]);
    setSelectedMatchChip(null);
  };

  // --- Renderers for the 5 interactive question types ---
  const renderChoiceItem = (item: WorksheetChoiceItem, idx: number) => {
    const picked = typeof answers[item.id] === 'number' ? (answers[item.id] as number) : -1;
    const detail = detailById.get(item.id);
    const cardState = detail ? (detail.correct ? 'correct' : 'wrong') : '';
    const isMissing = missingWarning.some((m) => m === `ข้อ ${idx + 1}`);

    return (
      <div
        key={item.id}
        className={`iw-item-card ${cardState} ${isMissing ? 'missing-highlight' : ''}`}
      >
        <div className="iw-item-head">
          <div className="iw-item-title-wrap">
            <span className="iw-item-num">{idx + 1}</span>
            <p className="iw-item-prompt">{item.prompt}</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
            {renderSpeakBtn(
              `choice_${item.id}`,
              `ข้อที่ ${idx + 1} ${item.prompt}. ${item.options
                .map((o, oi) => `ข้อ ${['กอ', 'ขอ', 'คอ', 'งอ', 'จอ', 'ฉอ'][oi] || oi + 1} ${o}`)
                .join('. ')}`,
            )}
            <span className="iw-kind-tag">🔘 เลือกตอบ</span>
            <span className={`iw-pill ${item.domain}`}>
              {item.domain.toUpperCase()} {detail ? `${detail.earned}/` : ''}
              {item.points} คะแนน
            </span>
          </div>
        </div>

        <div className="iw-choice-list">
          {item.options.map((opt, oIdx) => {
            let cls = 'iw-choice-btn';
            if (isReviewMode) {
              if (oIdx === item.correctIndex) cls += ' review-correct';
              else if (oIdx === picked && picked !== item.correctIndex) cls += ' review-wrong';
            } else if (oIdx === picked) {
              cls += ' selected';
            }
            return (
              <button
                key={oIdx}
                type="button"
                disabled={isReviewMode}
                className={cls}
                onClick={() => updateAnswer(item.id, oIdx)}
              >
                <span className="iw-choice-letter">{THAI_CHOICE_LETTERS[oIdx] || oIdx + 1}</span>
                <span style={{ flex: 1 }}>{opt}</span>
                {isReviewMode && oIdx === item.correctIndex && <span>✅</span>}
                {isReviewMode && oIdx === picked && picked !== item.correctIndex && <span>❌</span>}
              </button>
            );
          })}
        </div>

        {isReviewMode && detail && spec.showExplanationAfterSubmit !== false && item.explanation && (
          <div className={`iw-explanation ${detail.correct ? '' : 'wrong'}`}>
            <strong>{detail.correct ? '✅ ถูกต้อง! ' : '💡 เฉลย: '}</strong>
            {item.explanation}
          </div>
        )}
      </div>
    );
  };

  const renderFollowupItem = (item: WorksheetFollowupItem, idx: number) => {
    const totalPts = item.steps.reduce((s, st) => s + st.points, 0);
    const isMissing = missingWarning.some((m) => m.startsWith(`ข้อ ${idx + 1}.`));

    return (
      <div key={item.id} className={`iw-item-card ${isMissing ? 'missing-highlight' : ''}`}>
        <div className="iw-item-head">
          <div className="iw-item-title-wrap">
            <span className="iw-item-num">{idx + 1}</span>
            <p className="iw-item-prompt">สถานการณ์วิเคราะห์และคำถามต่อเนื่อง (ถามต่อ {item.steps.length} ขั้น)</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
            {renderSpeakBtn(`followup_${item.id}`, `ข้อที่ ${idx + 1} สถานการณ์ ${item.scenario}`)}
            <span className="iw-kind-tag" style={{ background: '#ede9fe', color: '#5b21b6' }}>
              💬 ถามต่อ
            </span>
            <span className="iw-pill">รวม {totalPts} คะแนน</span>
          </div>
        </div>

        <div className="iw-scenario-box">📖 {item.scenario}</div>

        <div className="iw-followup-steps">
          {item.steps.map((step, sIdx) => {
            const key = followupAnswerKey(item.id, step.id);
            const val = answers[key];
            const detail = detailById.get(key);

            // ปลดล็อกขั้นถัดไปเมื่อขั้นก่อนหน้ามีคำตอบแล้ว (หรืออยู่ในโหมดตรวจผล)
            let isUnlocked = true;
            if (!isReviewMode && sIdx > 0) {
              const prevStep = item.steps[sIdx - 1];
              const prevKey = followupAnswerKey(item.id, prevStep.id);
              const prevVal = answers[prevKey];
              isUnlocked =
                prevStep.kind === 'choice'
                  ? typeof prevVal === 'number' && prevVal >= 0
                  : typeof prevVal === 'string' && prevVal.trim().length >= 2;
            }

            const stepState = detail ? (detail.correct ? 'correct' : 'wrong') : '';

            return (
              <div
                key={step.id}
                className={`iw-followup-step ${!isUnlocked ? 'locked' : ''} ${stepState}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="iw-step-badge">
                    {sIdx === 0 ? '🔹 คำถามตั้งต้น' : `↳ ถามต่อขั้นที่ ${sIdx + 1}`}
                  </span>
                  <span className={`iw-pill ${step.domain}`} style={{ fontSize: '0.73rem' }}>
                    {step.domain.toUpperCase()} {detail ? `${detail.earned}/` : ''}
                    {step.points} คะแนน
                  </span>
                </div>

                {!isUnlocked ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>
                    <Lock size={15} />
                    <span>ตอบคำถามขั้นที่ {sIdx} ก่อน เพื่อปลดล็อกคำถามต่อขั้นที่ {sIdx + 1}</span>
                  </div>
                ) : (
                  <>
                    <p style={{ margin: '4px 0 10px', fontWeight: 700, fontSize: '0.92rem' }}>
                      {step.prompt}
                    </p>

                    {step.kind === 'choice' && step.options ? (
                      <div className="iw-choice-list">
                        {step.options.map((opt, oIdx) => {
                          const picked = typeof val === 'number' ? val : -1;
                          let cls = 'iw-choice-btn';
                          if (isReviewMode) {
                            if (oIdx === step.correctIndex) cls += ' review-correct';
                            else if (oIdx === picked && picked !== step.correctIndex) cls += ' review-wrong';
                          } else if (oIdx === picked) {
                            cls += ' selected';
                          }
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              disabled={isReviewMode}
                              className={cls}
                              onClick={() => updateAnswer(key, oIdx)}
                            >
                              <span className="iw-choice-letter">{THAI_CHOICE_LETTERS[oIdx] || oIdx + 1}</span>
                              <span style={{ flex: 1 }}>{opt}</span>
                              {isReviewMode && oIdx === step.correctIndex && <span>✅</span>}
                              {isReviewMode && oIdx === picked && picked !== step.correctIndex && <span>❌</span>}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="iw-short-input"
                        disabled={isReviewMode}
                        value={typeof val === 'string' ? val : ''}
                        onChange={(e) => updateAnswer(key, e.target.value)}
                        placeholder={step.placeholder || 'พิมพ์คำตอบสั้นๆ ของเธอที่นี่...'}
                      />
                    )}

                    {isReviewMode && detail && spec.showExplanationAfterSubmit !== false && (
                      <div className={`iw-explanation ${detail.correct ? '' : 'wrong'}`}>
                        <strong>
                          {detail.correct
                            ? '✅ ถูกต้อง! '
                            : detail.needsManualReview
                              ? '⏳ บันทึกคำตอบแล้ว (รอครูตรวจเพิ่ม): '
                              : `💡 แนวคำตอบ (${detail.expectedSummary}): `}
                        </strong>
                        {step.explanation || ''}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBlockOrderItem = (item: WorksheetBlockOrderItem, idx: number) => {
    const shuffled = getShuffledBlocks(item);
    const placedIds = getPlacedBlocks(item.id);
    const placedSet = new Set(placedIds);
    const availableBlocks = shuffled.filter((b) => !placedSet.has(b.id));
    const blockMap = new Map(item.blocks.map((b) => [b.id, b]));
    const detail = detailById.get(item.id);
    const cardState = detail ? (detail.correct ? 'correct' : 'wrong') : '';
    const isMissing = missingWarning.some((m) => m.startsWith(`ข้อ ${idx + 1} (`));

    return (
      <div
        key={item.id}
        className={`iw-item-card ${cardState} ${isMissing ? 'missing-highlight' : ''}`}
      >
        <div className="iw-item-head">
          <div className="iw-item-title-wrap">
            <span className="iw-item-num">{idx + 1}</span>
            <p className="iw-item-prompt">{item.prompt}</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
            {renderSpeakBtn(`block_${item.id}`, `ข้อที่ ${idx + 1} ลากบล็อกเรียงลำดับ ${item.prompt}`)}
            <span className="iw-kind-tag" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
              🧱 ลากบล็อกต่อบล็อก
            </span>
            <span className={`iw-pill ${item.domain}`}>
              {item.domain.toUpperCase()} {detail ? `${detail.earned}/` : ''}
              {item.points} คะแนน
            </span>
          </div>
        </div>

        <div className="iw-block-grid">
          {/* คลังบล็อก */}
          <div className="iw-block-panel">
            <div className="iw-block-panel-head">
              <span>📦 คลังบล็อก (คลิกหรือลากไปต่อ)</span>
              <span>เหลือ {availableBlocks.length} บล็อก</span>
            </div>
            {availableBlocks.length === 0 ? (
              <div className="iw-block-empty-hint">
                ✅ นำบล็อกไปต่อครบทั้งหมดแล้ว!
                <br />
                ตรวจลำดับด้านขวา หรือกดปุ่ม ▲▼ เพื่อสลับตำแหน่งได้
              </div>
            ) : (
              <div className="iw-block-list">
                {availableBlocks.map((block) => (
                  <div
                    key={block.id}
                    draggable={!isReviewMode}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({ itemId: item.id, blockId: block.id }));
                    }}
                    onClick={() => addBlockToStack(item.id, block.id)}
                    className="iw-block-piece"
                    style={{ background: block.color || '#2563eb' }}
                    role="button"
                    tabIndex={isReviewMode ? -1 : 0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        addBlockToStack(item.id, block.id);
                      }
                    }}
                    title="คลิกหรือลากไปวางในช่องต่อบล็อก"
                  >
                    <span>{block.icon || '🧩'}</span>
                    <span style={{ flex: 1 }}>{block.label}</span>
                    {!isReviewMode && <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>+ ต่อ</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* พื้นที่ต่อบล็อก */}
          <div
            className={`iw-block-panel target ${dragOverBlockItem === item.id ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              if (isReviewMode) return;
              e.preventDefault();
              setDragOverBlockItem(item.id);
            }}
            onDragLeave={() => setDragOverBlockItem(null)}
            onDrop={(e) => {
              if (isReviewMode) return;
              e.preventDefault();
              setDragOverBlockItem(null);
              try {
                const payload = JSON.parse(e.dataTransfer.getData('text/plain')) as {
                  itemId?: string;
                  blockId?: string;
                };
                if (payload.itemId === item.id && payload.blockId) {
                  addBlockToStack(item.id, payload.blockId);
                }
              } catch {
                // ignore invalid drop
              }
            }}
          >
            <div className="iw-block-panel-head">
              <span>🧩 ลำดับบล็อกของเธอ (บน → ล่าง)</span>
              {!isReviewMode && placedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => updateAnswer(item.id, [])}
                  style={{
                    border: 'none',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ล้างบล็อก
                </button>
              )}
            </div>

            {placedIds.length === 0 ? (
              <div className="iw-block-empty-hint">
                👆 <strong>คลิก</strong> ที่บล็อกฝั่งซ้าย หรือ <strong>ลากมาวางที่นี่</strong>
                <br />
                เพื่อต่อเป็นลำดับคำสั่งทีละขั้น (ต้องครบ {item.correctOrder.length} บล็อก)
              </div>
            ) : (
              <div className="iw-block-list">
                {placedIds.map((blockId, pIdx) => {
                  const block = blockMap.get(blockId);
                  if (!block) return null;
                  const posCorrect = isReviewMode && item.correctOrder[pIdx] === blockId;
                  const posWrong = isReviewMode && item.correctOrder[pIdx] !== blockId;
                  return (
                    <div
                      key={blockId}
                      draggable={!isReviewMode}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          'text/plain',
                          JSON.stringify({ itemId: item.id, blockId }),
                        );
                      }}
                      onDragOver={(e) => {
                        if (!isReviewMode) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (isReviewMode) return;
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverBlockItem(null);
                        try {
                          const payload = JSON.parse(e.dataTransfer.getData('text/plain')) as {
                            itemId?: string;
                            blockId?: string;
                          };
                          if (payload.itemId === item.id && payload.blockId) {
                            addBlockToStack(item.id, payload.blockId, pIdx);
                          }
                        } catch {
                          // ignore
                        }
                      }}
                      className={`iw-block-piece stacked ${
                        posCorrect ? 'pos-correct' : posWrong ? 'pos-wrong' : ''
                      }`}
                      style={{ background: block.color || '#2563eb' }}
                    >
                      <span className="iw-block-step-no">{pIdx + 1}</span>
                      <span>{block.icon || '🧩'}</span>
                      <span style={{ flex: 1 }}>{block.label}</span>
                      {isReviewMode ? (
                        <span>{posCorrect ? '✅' : '❌'}</span>
                      ) : (
                        <div className="iw-block-controls">
                          <button
                            type="button"
                            className="iw-block-ctrl-btn"
                            disabled={pIdx === 0}
                            onClick={() => moveBlockInStack(item.id, pIdx, -1)}
                            title="เลื่อนขึ้น"
                            aria-label="เลื่อนบล็อกขึ้น"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            className="iw-block-ctrl-btn"
                            disabled={pIdx === placedIds.length - 1}
                            onClick={() => moveBlockInStack(item.id, pIdx, 1)}
                            title="เลื่อนลง"
                            aria-label="เลื่อนบล็อกลง"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            className="iw-block-ctrl-btn"
                            onClick={() => removeBlockFromStack(item.id, blockId)}
                            title="นำกลับคลัง"
                            aria-label="นำบล็อกกลับคลัง"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {isReviewMode && detail && spec.showExplanationAfterSubmit !== false && (
          <div className={`iw-explanation ${detail.correct ? '' : 'wrong'}`}>
            <strong>{detail.correct ? '✅ ต่อบล็อกถูกต้องครบทุกขั้น! ' : '💡 ลำดับที่ถูกต้อง: '}</strong>
            {!detail.correct && <span>{detail.expectedSummary} — </span>}
            {item.explanation || ''}
          </div>
        )}
      </div>
    );
  };

  const renderMatchGroupItem = (item: WorksheetMatchGroupItem, idx: number) => {
    const mapping = getMatchMapping(item.id);
    const unassigned = item.items.filter((entry) => !mapping[entry.id]);
    const detail = detailById.get(item.id);
    const cardState = detail ? (detail.correct ? 'correct' : 'wrong') : '';
    const isMissing = missingWarning.some((m) => m.startsWith(`ข้อ ${idx + 1} (`));
    const isPickingForThis = selectedMatchChip?.itemId === item.id;

    return (
      <div
        key={item.id}
        className={`iw-item-card ${cardState} ${isMissing ? 'missing-highlight' : ''}`}
      >
        <div className="iw-item-head">
          <div className="iw-item-title-wrap">
            <span className="iw-item-num">{idx + 1}</span>
            <p className="iw-item-prompt">{item.prompt}</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
            {renderSpeakBtn(
              `match_${item.id}`,
              `ข้อที่ ${idx + 1} จัดหมวดหมู่ ${item.prompt}. หมวดหมู่มี ${item.groups.map((g) => g.label).join(', ')}`,
            )}
            <span className="iw-kind-tag" style={{ background: '#ffedd5', color: '#9a3412' }}>
              🗂️ จัดหมวดหมู่
            </span>
            <span className={`iw-pill ${item.domain}`}>
              {item.domain.toUpperCase()} {detail ? `${detail.earned}/` : ''}
              {item.points} คะแนน
            </span>
          </div>
        </div>

        {!isReviewMode && (
          <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: 8 }}>
            {isPickingForThis
              ? '👇 กดที่กล่องหมวดหมู่ด้านล่าง เพื่อนำป้ายที่เลือกไปวาง'
              : '💡 ลากป้ายลงกล่องหมวดหมู่ หรือคลิกเลือกป้ายแล้วคลิกกล่องเป้าหมายก็ได้ครับ'}
          </div>
        )}

        {/* คลังป้ายที่ยังไม่จัดหมวด */}
        <div
          className="iw-match-pool"
          onDragOver={(e) => {
            if (!isReviewMode) e.preventDefault();
          }}
          onDrop={(e) => {
            if (isReviewMode) return;
            e.preventDefault();
            try {
              const payload = JSON.parse(e.dataTransfer.getData('text/plain')) as {
                itemId?: string;
                entryId?: string;
              };
              if (payload.itemId === item.id && payload.entryId) {
                assignMatchEntry(item.id, payload.entryId, null);
              }
            } catch {
              // ignore
            }
          }}
        >
          {unassigned.length === 0 ? (
            <span style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 700 }}>
              ✅ จัดหมวดหมู่ครบทุกรายการแล้ว (คลิกป้ายในกล่องหากต้องการย้ายกลับ)
            </span>
          ) : (
            unassigned.map((entry) => {
              const isPicked =
                selectedMatchChip?.itemId === item.id && selectedMatchChip?.entryId === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  disabled={isReviewMode}
                  draggable={!isReviewMode}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'text/plain',
                      JSON.stringify({ itemId: item.id, entryId: entry.id }),
                    );
                  }}
                  onClick={() =>
                    setSelectedMatchChip(
                      isPicked ? null : { itemId: item.id, entryId: entry.id },
                    )
                  }
                  className={`iw-match-chip ${isPicked ? 'active-pick' : ''}`}
                >
                  🏷️ {entry.label}
                </button>
              );
            })
          )}
        </div>

        {/* กล่องหมวดหมู่เป้าหมาย */}
        <div className="iw-match-groups">
          {item.groups.map((grp) => {
            const placedEntries = item.items.filter((entry) => mapping[entry.id] === grp.id);
            const bucketKey = `${item.id}::${grp.id}`;
            return (
              <div
                key={grp.id}
                className={`iw-match-bucket ${isPickingForThis ? 'clickable-drop' : ''} ${
                  dragOverBucket === bucketKey ? 'drag-over' : ''
                }`}
                style={{ borderColor: grp.color || '#94a3b8' }}
                onClick={() => {
                  if (isPickingForThis && selectedMatchChip) {
                    assignMatchEntry(item.id, selectedMatchChip.entryId, grp.id);
                  }
                }}
                onDragOver={(e) => {
                  if (isReviewMode) return;
                  e.preventDefault();
                  setDragOverBucket(bucketKey);
                }}
                onDragLeave={() => setDragOverBucket(null)}
                onDrop={(e) => {
                  if (isReviewMode) return;
                  e.preventDefault();
                  setDragOverBucket(null);
                  try {
                    const payload = JSON.parse(e.dataTransfer.getData('text/plain')) as {
                      itemId?: string;
                      entryId?: string;
                    };
                    if (payload.itemId === item.id && payload.entryId) {
                      assignMatchEntry(item.id, payload.entryId, grp.id);
                    }
                  } catch {
                    // ignore
                  }
                }}
              >
                <div className="iw-bucket-title" style={{ color: grp.color || '#1e293b' }}>
                  <span>{grp.icon || '📂'}</span>
                  <span>{grp.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.74rem', opacity: 0.75 }}>
                    ({placedEntries.length})
                  </span>
                </div>
                <div className="iw-bucket-items">
                  {placedEntries.length === 0 ? (
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {isPickingForThis ? '👆 คลิกที่นี่เพื่อวาง' : 'ลากหรือคลิกวางที่นี่'}
                    </span>
                  ) : (
                    placedEntries.map((entry) => {
                      const entryCorrect = isReviewMode && entry.correctGroupId === grp.id;
                      const entryWrong = isReviewMode && entry.correctGroupId !== grp.id;
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          disabled={isReviewMode}
                          draggable={!isReviewMode}
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              'text/plain',
                              JSON.stringify({ itemId: item.id, entryId: entry.id }),
                            );
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            assignMatchEntry(item.id, entry.id, null);
                          }}
                          className={`iw-match-chip ${
                            entryCorrect ? 'chip-correct' : entryWrong ? 'chip-wrong' : ''
                          }`}
                          title={isReviewMode ? undefined : 'คลิกเพื่อนำออกจากกล่อง'}
                        >
                          <span>{entry.label}</span>
                          {isReviewMode ? (
                            <span>{entryCorrect ? '✅' : '❌'}</span>
                          ) : (
                            <span style={{ opacity: 0.55 }}>×</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isReviewMode && detail && spec.showExplanationAfterSubmit !== false && (
          <div className={`iw-explanation ${detail.correct ? '' : 'wrong'}`}>
            <strong>{detail.correct ? '✅ จัดหมวดหมู่ถูกต้องครบถ้วน! ' : '💡 เฉลย: '}</strong>
            {!detail.correct && <span>{detail.expectedSummary} — </span>}
            {item.explanation || ''}
          </div>
        )}
      </div>
    );
  };

  const renderShortAnswerItem = (item: WorksheetShortAnswerItem, idx: number) => {
    const val = typeof answers[item.id] === 'string' ? (answers[item.id] as string) : '';
    const detail = detailById.get(item.id);
    const cardState = detail ? (detail.correct ? 'correct' : 'wrong') : '';
    const isMissing = missingWarning.some((m) => m === `ข้อ ${idx + 1}`);

    return (
      <div
        key={item.id}
        className={`iw-item-card ${cardState} ${isMissing ? 'missing-highlight' : ''}`}
      >
        <div className="iw-item-head">
          <div className="iw-item-title-wrap">
            <span className="iw-item-num">{idx + 1}</span>
            <p className="iw-item-prompt">{item.prompt}</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
            {renderSpeakBtn(`short_${item.id}`, `ข้อที่ ${idx + 1} ${item.prompt}`)}
            <span className="iw-kind-tag">✍️ เติมคำสั้น</span>
            <span className={`iw-pill ${item.domain}`}>
              {item.domain.toUpperCase()} {detail ? `${detail.earned}/` : ''}
              {item.points} คะแนน
            </span>
          </div>
        </div>

        <input
          type="text"
          className="iw-short-input"
          disabled={isReviewMode}
          value={val}
          onChange={(e) => updateAnswer(item.id, e.target.value)}
          placeholder={item.placeholder || 'พิมพ์คำตอบของเธอที่นี่...'}
        />

        {isReviewMode && detail && spec.showExplanationAfterSubmit !== false && (
          <div className={`iw-explanation ${detail.correct ? '' : 'wrong'}`}>
            <strong>
              {detail.correct
                ? '✅ ถูกต้อง! '
                : detail.needsManualReview
                  ? '⏳ บันทึกคำตอบแล้ว (รอครูตรวจเพิ่ม): '
                  : `💡 แนวคำตอบ (${detail.expectedSummary}): `}
            </strong>
            {item.explanation || ''}
          </div>
        )}
      </div>
    );
  };

  const resultTone = submittedResult
    ? submittedResult.percent >= 70
      ? ''
      : submittedResult.percent >= 50
        ? 'mid'
        : 'low'
    : '';

  return (
    <div className="iw-player">
      {/* แถบสถานะและความคืบหน้า */}
      <div className="iw-sticky-bar">
        <div className="iw-sticky-top">
          <span className={`iw-mode-badge ${practiceMode ? 'practice' : 'official'}`}>
            <Sparkles size={13} />
            {practiceMode
              ? 'โหมดฝึกทำในเว็บ (ตรวจคะแนนทันที)'
              : locked
                ? '✅ ครูยืนยันคะแนนลง ปพ.5 แล้ว'
                : '🧩 ใบงานโต้ตอบส่งครู (ตรวจอัตโนมัติ)'}
          </span>
          <div className="iw-score-pills">
            <span className="iw-pill">
              ตอบแล้ว {liveProgress.answered}/{liveProgress.total} ข้อย่อย
            </span>
            <span className="iw-pill k">K {maxScores.kMax}</span>
            <span className="iw-pill p">P {maxScores.pMax}</span>
          </div>
        </div>
        <div className="iw-progress-track">
          <div className="iw-progress-fill" style={{ width: `${liveProgress.pct}%` }} />
        </div>
      </div>

      {/* คำชี้แจงใบงาน */}
      {(spec.intro || description) && (
        <div className="iw-intro-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <strong>📌 คำชี้แจง ({title}):</strong> {spec.intro || description}
          </div>
          {renderSpeakBtn('intro', `${title}. ${spec.intro || description || ''}`, 'ฟังคำชี้แจง')}
        </div>
      )}

      {/* กล่องสรุปผลคะแนนทันทีหลังส่ง */}
      {submittedResult && (
        <div className={`iw-result-card ${resultTone}`} role="status">
          <div className="iw-result-header">
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f766e' }}>
                {submittedResult.percent >= 80
                  ? '🎉 ยอดเยี่ยมมาก! ทำใบงานเสร็จสมบูรณ์'
                  : submittedResult.percent >= 60
                    ? '👏 ทำได้ดีมาก! ผ่านเกณฑ์แล้ว'
                    : '💪 ส่งเรียบร้อยแล้ว ลองอ่านเฉลยด้านล่างเพื่อทบทวนนะ'}
              </div>
              <div className="iw-result-score-big">
                {locked && reviewedResult?.score !== undefined
                  ? `${reviewedResult.score}/${reviewedResult.maxScore ?? submittedResult.totalMax}`
                  : `${submittedResult.totalScore}/${submittedResult.totalMax}`}{' '}
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>
                  คะแนน ({submittedResult.percent}%)
                </span>
              </div>
              <div className="iw-result-meta">
                <span className="iw-pill k">
                  K ความรู้: {locked && reviewedResult?.kScore !== undefined ? reviewedResult.kScore : submittedResult.kScore}/{submittedResult.kMax}
                </span>
                <span className="iw-pill p">
                  P ปฏิบัติ: {locked && reviewedResult?.pScore !== undefined ? reviewedResult.pScore : submittedResult.pScore}/{submittedResult.pMax}
                </span>
                {submittedResult.needsManualReviewCount > 0 && (
                  <span className="iw-pill" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}>
                    ⏳ รอครูตรวจข้อเขียน {submittedResult.needsManualReviewCount} ข้อ
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!locked && spec.allowRetry !== false && (
                <button type="button" className="btn-secondary" onClick={handleRetry}>
                  <RotateCcw size={15} /> แก้คำตอบ / ทำใหม่
                </button>
              )}
              {onClose && (
                <button type="button" className="btn-primary" onClick={onClose}>
                  <CheckCircle2 size={15} /> เสร็จสิ้น
                </button>
              )}
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {practiceMode
              ? '🎯 นี่คือโหมดฝึกทำในเว็บ นักเรียนสามารถดูเฉลยด้านล่างหรือกด "ทำใหม่" เพื่อฝึกซ้ำได้ไม่จำกัด'
              : locked
                ? `✅ คะแนนนี้ถูกยืนยันลงสมุดคะแนน ปพ.5 เรียบร้อยแล้ว${reviewedResult?.feedback ? ` · 💬 ${reviewedResult.feedback}` : ''}`
                : '📋 บันทึกคำตอบและผลตรวจอัตโนมัติส่งให้คุณครูเรียบร้อยแล้ว คุณครูสามารถกดยืนยันตัดคะแนนลง ปพ.5 ได้ทันทีครับ'}
          </div>

          {/* วงจรซ่อมเสริมอัตโนมัติ (Diagnostic Feedback) */}
          {(() => {
            const missed = submittedResult.details.filter((d) => !d.correct && !d.needsManualReview);
            if (missed.length === 0) return null;
            const missedK = missed.filter((d) => d.domain === 'k').length;
            const missedP = missed.filter((d) => d.domain === 'p').length;
            return (
              <div className="iw-diagnostic-box">
                <div className="iw-diagnostic-head">
                  <strong>🎯 จุดที่ควรทบทวนเพิ่มเติม ({missed.length} ข้อย่อย)</strong>
                  <span>
                    {missedK > 0 ? `ความรู้ K: ${missedK} ข้อ` : ''}
                    {missedK > 0 && missedP > 0 ? ' · ' : ''}
                    {missedP > 0 ? `ปฏิบัติ P: ${missedP} ข้อ` : ''}
                  </span>
                </div>
                <ul className="iw-diagnostic-list">
                  {missed.slice(0, 4).map((m) => (
                    <li key={m.id}>
                      <strong>{m.label}</strong>
                      {m.expectedSummary ? ` — แนวคำตอบ: ${m.expectedSummary}` : ''}
                    </li>
                  ))}
                </ul>
                <div className="iw-diagnostic-actions">
                  <Link to="/courses" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    <BookOpen size={14} /> ทบทวนสไลด์บทเรียน
                  </Link>
                  <Link to="/games" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    <Gamepad2 size={14} /> ฝึกเพิ่มในคลังเกม
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* รายการโจทย์ทุกข้อ */}
      {spec.items.map((item, idx) => {
        if (item.kind === 'choice') return renderChoiceItem(item, idx);
        if (item.kind === 'followup') return renderFollowupItem(item, idx);
        if (item.kind === 'block_order') return renderBlockOrderItem(item, idx);
        if (item.kind === 'match_group') return renderMatchGroupItem(item, idx);
        return renderShortAnswerItem(item, idx);
      })}

      {/* แจ้งเตือนข้อที่ยังทำไม่ครบ */}
      {missingWarning.length > 0 && (
        <div className="iw-missing-alert" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={16} />
            <span>ยังตอบไม่ครบ {missingWarning.length} รายการ: {missingWarning.join(', ')}</span>
          </div>
        </div>
      )}

      {/* ปุ่มส่งด้านล่าง */}
      <div className="iw-footer-actions">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!isReviewMode && (
            <button
              type="button"
              className="btn-secondary"
              disabled={submitting}
              onClick={handleResetAll}
              style={{ fontSize: '0.84rem' }}
            >
              <RotateCcw size={14} /> เริ่มทำใหม่ทั้งหมด
            </button>
          )}
          {onClose && (
            <button
              type="button"
              className="btn-secondary"
              disabled={submitting}
              onClick={onClose}
              style={{ fontSize: '0.84rem' }}
            >
              ปิดหน้าต่าง
            </button>
          )}
        </div>

        {!isReviewMode && (
          <button
            type="button"
            className="btn-primary"
            disabled={submitting}
            onClick={() => void handleSubmitWorksheet()}
            style={{
              padding: '10px 20px',
              fontSize: '0.94rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #2563eb, #10b981)',
            }}
          >
            <Send size={15} />{' '}
            {submitting
              ? 'กำลังส่งคำตอบ...'
              : practiceMode
                ? 'ตรวจคำตอบทันที'
                : 'ส่งใบงานและตรวจคะแนนทันที'}
          </button>
        )}
      </div>
    </div>
  );
};

export default InteractiveWorksheetPlayer;
