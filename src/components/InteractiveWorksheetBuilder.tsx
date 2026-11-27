import React, { useMemo, useState } from 'react';
import { Eye, Plus, Rocket, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { allClassrooms2569 } from '../data/students2569';
import { getIndicators, getSubjectsForClassroom, type Subject } from '../services/gradeService';
import {
  createInteractiveWorksheetAssignment,
  type Assignment,
} from '../services/homeworkService';
import type { InteractiveWorksheetTemplate } from '../data/interactiveWorksheetTemplates';
import {
  getWorksheetMaxScores,
  type InteractiveWorksheetSpec,
  type WorksheetBlockOrderItem,
  type WorksheetChoiceItem,
  type WorksheetDomain,
  type WorksheetFollowupItem,
  type WorksheetItem,
  type WorksheetMatchGroupItem,
  type WorksheetShortAnswerItem,
} from '../utils/interactiveWorksheetEngine';
import InteractiveWorksheetPlayer from './InteractiveWorksheetPlayer';
import { appAlert } from '../services/appDialogService';

const BLOCK_PALETTE = ['#2563eb', '#0891b2', '#16a34a', '#9333ea', '#ea580c', '#db2777'];
const itemUid = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const cloneSpec = (spec: InteractiveWorksheetSpec): InteractiveWorksheetSpec =>
  JSON.parse(JSON.stringify(spec)) as InteractiveWorksheetSpec;

export interface InteractiveWorksheetBuilderProps {
  initialTemplate?: InteractiveWorksheetTemplate | null;
  defaultClassroom?: string;
  onPublished: (assignment: Assignment) => void;
  onClose: () => void;
}

const makeBlankChoice = (): WorksheetChoiceItem => ({
  id: itemUid('ch'),
  kind: 'choice',
  domain: 'k',
  points: 2,
  prompt: 'คำถามปรนัยข้อใหม่',
  options: ['ตัวเลือกที่ 1 (ถูก)', 'ตัวเลือกที่ 2', 'ตัวเลือกที่ 3'],
  correctIndex: 0,
  explanation: 'อธิบายเหตุผลของคำตอบที่ถูกต้อง',
});

const makeBlankFollowup = (): WorksheetFollowupItem => ({
  id: itemUid('fu'),
  kind: 'followup',
  scenario: 'สถานการณ์: ระบุโจทย์สถานการณ์ให้นักเรียนวิเคราะห์ต่อเนื่อง',
  steps: [
    {
      id: 's1',
      kind: 'choice',
      domain: 'k',
      points: 1,
      prompt: 'ขั้นที่ 1: คำถามตั้งต้นเพื่อวิเคราะห์สถานการณ์',
      options: ['แนวทางที่ถูกต้อง', 'แนวทางที่ไม่เหมาะสม'],
      correctIndex: 0,
      explanation: 'เหตุผลของขั้นที่ 1',
    },
    {
      id: 's2',
      kind: 'choice',
      domain: 'k',
      points: 2,
      prompt: 'ถามต่อขั้นที่ 2: หากเกิดเงื่อนไขเพิ่มเติม ควรทำอย่างไรต่อ?',
      options: ['วิธีแก้ปัญหาต่อเนื่องที่ถูกต้อง', 'ปล่อยผ่านไปเลย'],
      correctIndex: 0,
      explanation: 'เหตุผลของคำถามต่อขั้นที่ 2',
    },
  ],
});

const makeBlankBlockOrder = (): WorksheetBlockOrderItem => ({
  id: itemUid('blk'),
  kind: 'block_order',
  domain: 'p',
  points: 3,
  prompt: 'ลากบล็อกมาต่อเรียงลำดับขั้นตอนจากบนลงล่างให้ถูกต้อง',
  blocks: [
    { id: 'b1', label: 'ขั้นตอนที่ 1: เริ่มต้นและเตรียมข้อมูล', icon: '🟢', color: BLOCK_PALETTE[0] },
    { id: 'b2', label: 'ขั้นตอนที่ 2: ประมวลผลตามเงื่อนไข', icon: '⚙️', color: BLOCK_PALETTE[1] },
    { id: 'b3', label: 'ขั้นตอนที่ 3: ตรวจสอบและแสดงผลลัพธ์', icon: '✅', color: BLOCK_PALETTE[2] },
  ],
  correctOrder: ['b1', 'b2', 'b3'],
  explanation: 'เรียงลำดับจากเริ่มต้น → ประมวลผล → แสดงผล',
});

const makeBlankMatchGroup = (): WorksheetMatchGroupItem => ({
  id: itemUid('mg'),
  kind: 'match_group',
  domain: 'p',
  points: 2,
  prompt: 'จัดหมวดหมู่รายการต่อไปนี้ลงในกล่องให้ถูกต้อง',
  groups: [
    { id: 'g1', label: 'กลุ่มที่ 1', icon: '📂', color: '#2563eb' },
    { id: 'g2', label: 'กลุ่มที่ 2', icon: '📁', color: '#16a34a' },
  ],
  items: [
    { id: 'm1', label: 'รายการตัวอย่าง ก', correctGroupId: 'g1' },
    { id: 'm2', label: 'รายการตัวอย่าง ข', correctGroupId: 'g2' },
  ],
  explanation: 'อธิบายเกณฑ์การจำแนกหมวดหมู่',
});

const makeBlankShortAnswer = (): WorksheetShortAnswerItem => ({
  id: itemUid('sa'),
  kind: 'short_answer',
  domain: 'k',
  points: 2,
  prompt: 'คำถามเติมคำสั้น (ระบุคำตอบที่ยอมรับด้านล่าง)',
  placeholder: 'พิมพ์คำตอบสั้นๆ...',
  acceptedAnswers: ['คำตอบที่ถูก'],
  acceptedKeywords: [],
  explanation: 'คำอธิบายเฉลย',
});

const InteractiveWorksheetBuilder: React.FC<InteractiveWorksheetBuilderProps> = ({
  initialTemplate,
  defaultClassroom = 'ป.1',
  onPublished,
  onClose,
}) => {
  const initClass = initialTemplate?.classroom || defaultClassroom;
  const initSubjects = getSubjectsForClassroom(initClass);
  const initSubj: Subject = initialTemplate?.subject || initSubjects[0]?.id || 'main';
  const initInds = getIndicators(initClass, initSubj);

  const [classroom, setClassroom] = useState(initClass);
  const [subject, setSubject] = useState<Subject>(initSubj);
  const [indicatorId, setIndicatorId] = useState(
    initialTemplate?.indicatorId || initInds[0]?.id || '',
  );
  const [dueDate, setDueDate] = useState(
    () => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  const [title, setTitle] = useState(
    initialTemplate?.title || `ใบงานโต้ตอบ ${initClass}: แบบฝึกหัดและต่อบล็อก`,
  );
  const [description, setDescription] = useState(
    initialTemplate?.description ||
      'ทำใบงานโต้ตอบออนไลน์ผ่านเว็บ (เลือกตอบ ถามต่อ ลากบล็อก จัดหมวดหมู่) ระบบตรวจคะแนนให้อัตโนมัติ',
  );
  const [spec, setSpec] = useState<InteractiveWorksheetSpec>(() =>
    initialTemplate
      ? cloneSpec(initialTemplate.spec)
      : {
          version: 1,
          intro: 'อ่านคำสั่งให้เข้าใจแล้วตอบทุกข้อ กดส่งเพื่อดูคะแนนและเฉลยได้ทันทีครับ',
          allowRetry: true,
          showExplanationAfterSubmit: true,
          items: [makeBlankChoice(), makeBlankBlockOrder(), makeBlankFollowup()],
        },
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const subjects = useMemo(() => getSubjectsForClassroom(classroom), [classroom]);
  const indicators = useMemo(() => getIndicators(classroom, subject), [classroom, subject]);
  const maxScores = useMemo(() => getWorksheetMaxScores(spec), [spec]);

  const handleClassroomChange = (nextClass: string) => {
    setClassroom(nextClass);
    const nextSubjs = getSubjectsForClassroom(nextClass);
    const nextSubj = nextSubjs[0]?.id || 'main';
    setSubject(nextSubj);
    const nextInds = getIndicators(nextClass, nextSubj);
    setIndicatorId(nextInds[0]?.id || '');
  };

  const handleSubjectChange = (nextSubj: Subject) => {
    setSubject(nextSubj);
    const nextInds = getIndicators(classroom, nextSubj);
    setIndicatorId(nextInds[0]?.id || '');
  };

  const updateItem = (idx: number, nextItem: WorksheetItem) => {
    setSpec((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? nextItem : it)),
    }));
  };

  const removeItem = (idx: number) => {
    setSpec((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const moveItem = (idx: number, delta: -1 | 1) => {
    setSpec((prev) => {
      const target = idx + delta;
      if (target < 0 || target >= prev.items.length) return prev;
      const items = [...prev.items];
      const [moved] = items.splice(idx, 1);
      items.splice(target, 0, moved);
      return { ...prev, items };
    });
  };

  const addItem = (item: WorksheetItem) => {
    setSpec((prev) => ({ ...prev, items: [...prev.items, item] }));
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      appAlert('กรุณากรอกชื่อใบงาน');
      return;
    }
    if (spec.items.length === 0) {
      appAlert('กรุณาเพิ่มโจทย์อย่างน้อย 1 ข้อ');
      return;
    }
    if (maxScores.totalMax <= 0) {
      appAlert('คะแนนรวมต้องมากกว่า 0');
      return;
    }
    setSaving(true);
    try {
      const created = await createInteractiveWorksheetAssignment({
        title: title.trim(),
        description: description.trim(),
        classroom,
        subject,
        indicatorId: indicatorId || undefined,
        dueDate,
        spec,
      });
      onPublished(created);
    } catch (err) {
      console.error(err);
      appAlert('สร้างใบงานโต้ตอบไม่สำเร็จ กรุณาตรวจการเชื่อมต่อ Firebase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 920,
          maxHeight: '94vh',
          overflowY: 'auto',
          background: '#ffffff',
          padding: '1.35rem',
          borderRadius: 18,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.18rem' }}>
              🧩 {initialTemplate ? 'ปรับแก้ใบงานโต้ตอบก่อนเปิดสั่ง' : 'สร้างใบงานโต้ตอบออนไลน์ใหม่'}
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
              คะแนนรวมอัตโนมัติ: <strong style={{ color: '#1d4ed8' }}>K {maxScores.kMax}</strong> +{' '}
              <strong style={{ color: '#15803d' }}>P {maxScores.pMax}</strong> ={' '}
              <strong>{maxScores.totalMax} คะแนน</strong> ({spec.items.length} ข้อหลัก)
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPreviewMode(!previewMode)}
              style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Eye size={14} /> {previewMode ? 'กลับไปหน้าแก้ไขโจทย์' : 'ลองทำเหมือนนักเรียน'}
            </button>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
              <X size={18} />
            </button>
          </div>
        </div>

        {previewMode ? (
          <div>
            <InteractiveWorksheetPlayer
              title={title}
              description={description}
              spec={spec}
              practiceMode
              onClose={() => setPreviewMode(false)}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 10,
                background: '#f8fafc',
                padding: 12,
                borderRadius: 12,
                border: '1px solid #e2e8f0',
              }}
            >
              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                ชั้นเรียน
                <select
                  value={classroom}
                  onChange={(e) => handleClassroomChange(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: 4 }}
                >
                  {allClassrooms2569.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                วิชา (เชื่อม ปพ.5)
                <select
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value as Subject)}
                  style={{ width: '100%', padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: 4 }}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.emoji} {s.title}</option>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                ตัวชี้วัด
                <select
                  value={indicatorId}
                  onChange={(e) => setIndicatorId(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: 4 }}
                >
                  {indicators.map((ind) => (
                    <option key={ind.id} value={ind.id}>{ind.code} — {ind.title.slice(0, 42)}</option>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                กำหนดส่ง
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: 4, boxSizing: 'border-box' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ชื่อใบงาน เช่น ใบงาน ป.4: ลากบล็อกผังงานและเหตุผลเชิงตรรกะ"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontWeight: 700, fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="คำอธิบายสั้นๆ ของใบงาน"
                style={{ width: '100%', padding: '7px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
              />
            </div>

            {/* Add Question Bar */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', padding: '10px 12px', background: '#eff6ff', borderRadius: 12, border: '1px dashed #93c5fd' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1d4ed8', marginRight: 4 }}>
                ➕ เพิ่มโจทย์:
              </span>
              <button type="button" className="btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 10px' }} onClick={() => addItem(makeBlankChoice())}>
                🔘 ปรนัย
              </button>
              <button type="button" className="btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 10px' }} onClick={() => addItem(makeBlankFollowup())}>
                💬 ถามต่อ
              </button>
              <button type="button" className="btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 10px' }} onClick={() => addItem(makeBlankBlockOrder())}>
                🧱 ลากบล็อกต่อบล็อก
              </button>
              <button type="button" className="btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 10px' }} onClick={() => addItem(makeBlankMatchGroup())}>
                🗂️ จัดหมวดหมู่
              </button>
              <button type="button" className="btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 10px' }} onClick={() => addItem(makeBlankShortAnswer())}>
                ✍️ เติมคำสั้น
              </button>
            </div>

            {/* Item Editors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {spec.items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 14,
                    padding: 12,
                    background: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: '0.88rem' }}>
                        ข้อ {idx + 1} ·{' '}
                        {item.kind === 'choice'
                          ? '🔘 ปรนัย'
                          : item.kind === 'followup'
                            ? '💬 ถามต่อ'
                            : item.kind === 'block_order'
                              ? '🧱 ลากบล็อกต่อบล็อก'
                              : item.kind === 'match_group'
                                ? '🗂️ จัดหมวดหมู่'
                                : '✍️ เติมคำสั้น'}
                      </strong>
                      {item.kind !== 'followup' && (
                        <>
                          <select
                            value={item.domain}
                            onChange={(e) => updateItem(idx, { ...item, domain: e.target.value as WorksheetDomain })}
                            style={{ padding: '2px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.76rem', fontWeight: 700 }}
                          >
                            <option value="k">K ความรู้</option>
                            <option value="p">P ปฏิบัติ</option>
                          </select>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={item.points}
                            onChange={(e) => updateItem(idx, { ...item, points: Math.max(1, Number(e.target.value) || 1) })}
                            style={{ width: 54, padding: '2px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.76rem' }}
                          />
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>คะแนน</span>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" className="cb-icon-btn" disabled={idx === 0} onClick={() => moveItem(idx, -1)} title="ย้ายขึ้น"><ArrowUp size={13} /></button>
                      <button type="button" className="cb-icon-btn" disabled={idx === spec.items.length - 1} onClick={() => moveItem(idx, 1)} title="ย้ายลง"><ArrowDown size={13} /></button>
                      <button type="button" className="cb-icon-btn danger" onClick={() => removeItem(idx)} title="ลบข้อนี้"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {/* Choice Editor */}
                  {item.kind === 'choice' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input
                        type="text"
                        value={item.prompt}
                        onChange={(e) => updateItem(idx, { ...item, prompt: e.target.value })}
                        placeholder="คำถาม"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                      />
                      {item.options.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="radio"
                            name={`correct_${item.id}`}
                            checked={item.correctIndex === oIdx}
                            onChange={() => updateItem(idx, { ...item, correctIndex: oIdx })}
                            title="เลือกเป็นเฉลยที่ถูก"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const nextOpts = [...item.options];
                              nextOpts[oIdx] = e.target.value;
                              updateItem(idx, { ...item, options: nextOpts });
                            }}
                            style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.84rem' }}
                          />
                          {item.options.length > 2 && (
                            <button
                              type="button"
                              className="cb-icon-btn danger"
                              onClick={() => {
                                const nextOpts = item.options.filter((_, i) => i !== oIdx);
                                updateItem(idx, {
                                  ...item,
                                  options: nextOpts,
                                  correctIndex: Math.min(item.correctIndex, nextOpts.length - 1),
                                });
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                          onClick={() => updateItem(idx, { ...item, options: [...item.options, `ตัวเลือกที่ ${item.options.length + 1}`] })}
                        >
                          <Plus size={12} /> เพิ่มตัวเลือก
                        </button>
                        <input
                          type="text"
                          value={item.explanation || ''}
                          onChange={(e) => updateItem(idx, { ...item, explanation: e.target.value })}
                          placeholder="คำอธิบายเฉลย (แสดงหลังส่ง)"
                          style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Followup Editor */}
                  {item.kind === 'followup' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        rows={2}
                        value={item.scenario}
                        onChange={(e) => updateItem(idx, { ...item, scenario: e.target.value })}
                        placeholder="สถานการณ์ตั้งต้น"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                      {item.steps.map((step, sIdx) => (
                        <div key={step.id} style={{ background: '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.8rem', color: '#1d4ed8' }}>
                              {sIdx === 0 ? 'ขั้นที่ 1 (ตั้งต้น)' : `↳ ถามต่อขั้นที่ ${sIdx + 1}`}
                            </strong>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                              <select
                                value={step.domain}
                                onChange={(e) => {
                                  const nextSteps = item.steps.map((st, i) =>
                                    i === sIdx ? { ...st, domain: e.target.value as WorksheetDomain } : st,
                                  );
                                  updateItem(idx, { ...item, steps: nextSteps });
                                }}
                                style={{ padding: '2px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.74rem' }}
                              >
                                <option value="k">K</option>
                                <option value="p">P</option>
                              </select>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={step.points}
                                onChange={(e) => {
                                  const nextSteps = item.steps.map((st, i) =>
                                    i === sIdx ? { ...st, points: Math.max(1, Number(e.target.value) || 1) } : st,
                                  );
                                  updateItem(idx, { ...item, steps: nextSteps });
                                }}
                                style={{ width: 48, padding: '2px 5px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.74rem' }}
                              />
                              {item.steps.length > 1 && (
                                <button
                                  type="button"
                                  className="cb-icon-btn danger"
                                  onClick={() => updateItem(idx, { ...item, steps: item.steps.filter((_, i) => i !== sIdx) })}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          <input
                            type="text"
                            value={step.prompt}
                            onChange={(e) => {
                              const nextSteps = item.steps.map((st, i) =>
                                i === sIdx ? { ...st, prompt: e.target.value } : st,
                              );
                              updateItem(idx, { ...item, steps: nextSteps });
                            }}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.83rem', marginBottom: 6, boxSizing: 'border-box' }}
                          />
                          {step.kind === 'choice' && step.options && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {step.options.map((opt, oIdx) => (
                                <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input
                                    type="radio"
                                    name={`fu_${item.id}_${step.id}`}
                                    checked={step.correctIndex === oIdx}
                                    onChange={() => {
                                      const nextSteps = item.steps.map((st, i) =>
                                        i === sIdx ? { ...st, correctIndex: oIdx } : st,
                                      );
                                      updateItem(idx, { ...item, steps: nextSteps });
                                    }}
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const nextOpts = [...(step.options || [])];
                                      nextOpts[oIdx] = e.target.value;
                                      const nextSteps = item.steps.map((st, i) =>
                                        i === sIdx ? { ...st, options: nextOpts } : st,
                                      );
                                      updateItem(idx, { ...item, steps: nextSteps });
                                    }}
                                    style={{ flex: 1, padding: '4px 7px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ alignSelf: 'flex-start', fontSize: '0.76rem', padding: '4px 10px' }}
                        onClick={() =>
                          updateItem(idx, {
                            ...item,
                            steps: [
                              ...item.steps,
                              {
                                id: `s${item.steps.length + 1}`,
                                kind: 'choice',
                                domain: 'k',
                                points: 1,
                                prompt: `ถามต่อขั้นที่ ${item.steps.length + 1}: ...`,
                                options: ['คำตอบที่ถูก', 'คำตอบลวง'],
                                correctIndex: 0,
                              },
                            ],
                          })
                        }
                      >
                        <Plus size={12} /> เพิ่มคำถามต่ออีกขั้น
                      </button>
                    </div>
                  )}

                  {/* Block Order Editor */}
                  {item.kind === 'block_order' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input
                        type="text"
                        value={item.prompt}
                        onChange={(e) => updateItem(idx, { ...item, prompt: e.target.value })}
                        placeholder="คำสั่งเรียงบล็อก"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                      />
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                        เรียงบล็อกตามลำดับเฉลยที่ถูกต้องจากบนลงล่าง (ฝั่งนักเรียนจะสลับลำดับให้อัตโนมัติ):
                      </div>
                      {item.blocks.map((blk, bIdx) => (
                        <div key={blk.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              background: blk.color || BLOCK_PALETTE[bIdx % BLOCK_PALETTE.length],
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {bIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={blk.label}
                            onChange={(e) => {
                              const nextBlocks = item.blocks.map((b, i) =>
                                i === bIdx ? { ...b, label: e.target.value } : b,
                              );
                              updateItem(idx, { ...item, blocks: nextBlocks });
                            }}
                            style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.83rem' }}
                          />
                          {item.blocks.length > 2 && (
                            <button
                              type="button"
                              className="cb-icon-btn danger"
                              onClick={() => {
                                const nextBlocks = item.blocks.filter((_, i) => i !== bIdx);
                                updateItem(idx, {
                                  ...item,
                                  blocks: nextBlocks,
                                  correctOrder: nextBlocks.map((b) => b.id),
                                });
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ alignSelf: 'flex-start', fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={() => {
                          const newId = itemUid('b');
                          const nextBlocks = [
                            ...item.blocks,
                            {
                              id: newId,
                              label: `ขั้นตอนที่ ${item.blocks.length + 1}`,
                              icon: '🧩',
                              color: BLOCK_PALETTE[item.blocks.length % BLOCK_PALETTE.length],
                            },
                          ];
                          updateItem(idx, {
                            ...item,
                            blocks: nextBlocks,
                            correctOrder: nextBlocks.map((b) => b.id),
                          });
                        }}
                      >
                        <Plus size={12} /> เพิ่มบล็อก
                      </button>
                    </div>
                  )}

                  {/* Match Group Editor */}
                  {item.kind === 'match_group' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        type="text"
                        value={item.prompt}
                        onChange={(e) => updateItem(idx, { ...item, prompt: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {item.groups.map((grp, gIdx) => (
                          <input
                            key={grp.id}
                            type="text"
                            value={grp.label}
                            onChange={(e) => {
                              const nextGroups = item.groups.map((g, i) =>
                                i === gIdx ? { ...g, label: e.target.value } : g,
                              );
                              updateItem(idx, { ...item, groups: nextGroups });
                            }}
                            placeholder={`ชื่อกล่อง ${gIdx + 1}`}
                            style={{ padding: '5px 8px', borderRadius: 8, border: `1.5px solid ${grp.color || '#94a3b8'}`, fontSize: '0.82rem', fontWeight: 700 }}
                          />
                        ))}
                      </div>
                      {item.items.map((entry, eIdx) => (
                        <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="text"
                            value={entry.label}
                            onChange={(e) => {
                              const nextEntries = item.items.map((en, i) =>
                                i === eIdx ? { ...en, label: e.target.value } : en,
                              );
                              updateItem(idx, { ...item, items: nextEntries });
                            }}
                            style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                          />
                          <select
                            value={entry.correctGroupId}
                            onChange={(e) => {
                              const nextEntries = item.items.map((en, i) =>
                                i === eIdx ? { ...en, correctGroupId: e.target.value } : en,
                              );
                              updateItem(idx, { ...item, items: nextEntries });
                            }}
                            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                          >
                            {item.groups.map((g) => (
                              <option key={g.id} value={g.id}>→ {g.label}</option>
                            ))}
                          </select>
                          {item.items.length > 2 && (
                            <button
                              type="button"
                              className="cb-icon-btn danger"
                              onClick={() => updateItem(idx, { ...item, items: item.items.filter((_, i) => i !== eIdx) })}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ alignSelf: 'flex-start', fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={() =>
                          updateItem(idx, {
                            ...item,
                            items: [
                              ...item.items,
                              {
                                id: itemUid('m'),
                                label: `รายการที่ ${item.items.length + 1}`,
                                correctGroupId: item.groups[0]?.id || '',
                              },
                            ],
                          })
                        }
                      >
                        <Plus size={12} /> เพิ่มรายการจัดหมวดหมู่
                      </button>
                    </div>
                  )}

                  {/* Short Answer Editor */}
                  {item.kind === 'short_answer' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input
                        type="text"
                        value={item.prompt}
                        onChange={(e) => updateItem(idx, { ...item, prompt: e.target.value })}
                        placeholder="คำถามเติมคำ"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                      />
                      <input
                        type="text"
                        value={(item.acceptedAnswers || []).join(', ')}
                        onChange={(e) =>
                          updateItem(idx, {
                            ...item,
                            acceptedAnswers: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="คำตอบที่ถูก (คั่นด้วยจุลภาค , เช่น print, input)"
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                      <input
                        type="text"
                        value={(item.acceptedKeywords || []).join(', ')}
                        onChange={(e) =>
                          updateItem(idx, {
                            ...item,
                            acceptedKeywords: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="คำสำคัญ (ถ้าต้องการตรวจแบบมีคำสำคัญ คั่นด้วย ,)"
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Publish Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={() => void handlePublish()}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #10b981)',
                  fontWeight: 800,
                  padding: '9px 18px',
                }}
              >
                <Rocket size={15} /> {saving ? 'กำลังเปิดสั่งใบงาน...' : `เปิดสั่งใบงานนี้ให้ห้อง ${classroom} ทันที`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveWorksheetBuilder;
