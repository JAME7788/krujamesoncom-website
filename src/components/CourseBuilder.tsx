import React, { useState } from 'react';
import {
  Plus, Trash2, Edit3, ChevronDown, ChevronRight, Save, X,
  Video, Gamepad2, BookOpen, Link as LinkIcon, FileText, Award,
  Download, Upload,
} from 'lucide-react';
import {
  loadCourses, createCourse, updateCourse, deleteCourse,
  addUnit, updateUnit, deleteUnit,
  addSlide, updateSlide, removeSlide,
  addLink, removeLink,
  addQuiz, removeQuiz,
  exportJSON, importJSON,
} from '../services/contentService';
import type { CustomCourse, CustomUnit, CustomLink } from '../services/contentService';

const CourseBuilder: React.FC = () => {
  const [courses, setCourses] = useState<CustomCourse[]>(loadCourses());
  const [openCourse, setOpenCourse] = useState<string | null>(null);
  const [openUnit, setOpenUnit] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);

  const refresh = () => setCourses(loadCourses());

  // ----- Course actions -----
  const handleAddCourse = () => {
    const c = createCourse({});
    refresh();
    setOpenCourse(c.id);
    setEditingCourse(c.id);
  };

  const handleDeleteCourse = (id: string) => {
    if (!confirm('ลบรายวิชานี้และเนื้อหาทั้งหมด? ไม่สามารถกู้คืนได้')) return;
    deleteCourse(id);
    refresh();
  };

  const handleSaveCourse = (id: string, patch: Partial<CustomCourse>) => {
    updateCourse(id, patch);
    refresh();
    setEditingCourse(null);
  };

  // ----- Unit actions -----
  const handleAddUnit = (courseId: string) => {
    const u = addUnit(courseId);
    refresh();
    if (u) {
      setOpenUnit(u.id);
      setEditingUnit(u.id);
    }
  };

  const handleSaveUnit = (courseId: string, unitId: string, patch: Partial<CustomUnit>) => {
    updateUnit(courseId, unitId, patch);
    refresh();
    setEditingUnit(null);
  };

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kru-james-courses-${Date.now()}.json`;
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ok = importJSON(ev.target?.result as string);
        if (ok) {
          alert('นำเข้าสำเร็จ ✓');
          refresh();
        } else {
          alert('ไฟล์ไม่ถูกต้อง');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="course-builder">
      <div className="cb-toolbar">
        <button className="btn-primary cb-add-btn" onClick={handleAddCourse}>
          <Plus size={18} /> เพิ่มรายวิชาใหม่
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn-secondary" onClick={handleImport}>
          <Upload size={16} /> นำเข้า JSON
        </button>
        <button className="btn-secondary" onClick={handleExport}>
          <Download size={16} /> ส่งออก JSON
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state-card">
          <BookOpen size={48} style={{ color: '#6366f1' }} />
          <h3>ยังไม่มีรายวิชา</h3>
          <p>เริ่มสร้างรายวิชาแรกของคุณ — เพิ่มหน่วย เพิ่มสไลด์ ลิงก์วิดีโอ เกม และแบบทดสอบได้</p>
          <button className="btn-primary" onClick={handleAddCourse}>
            <Plus size={18} /> สร้างรายวิชาแรก
          </button>
        </div>
      ) : (
        <div className="cb-courses">
          {courses.map((course) => (
            <div key={course.id} className="cb-course">
              {/* Course Header */}
              <div
                className="cb-course-head"
                onClick={() =>
                  setOpenCourse(openCourse === course.id ? null : course.id)
                }
              >
                <div className="cb-course-head-left">
                  {openCourse === course.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <span className="cb-emoji">{course.emoji}</span>
                  {editingCourse === course.id ? (
                    <CourseEditForm
                      course={course}
                      onSave={(patch) => handleSaveCourse(course.id, patch)}
                      onCancel={() => setEditingCourse(null)}
                    />
                  ) : (
                    <div>
                      <h3>{course.title}</h3>
                      <p>{course.description || 'ยังไม่มีคำอธิบาย'}</p>
                      <small>
                        {course.level && <span className="cb-tag">{course.level}</span>}{' '}
                        {course.units.length} หน่วย
                      </small>
                    </div>
                  )}
                </div>
                {editingCourse !== course.id && (
                  <div className="cb-course-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="cb-icon-btn" onClick={() => setEditingCourse(course.id)} title="แก้ไข">
                      <Edit3 size={16} />
                    </button>
                    <button className="cb-icon-btn danger" onClick={() => handleDeleteCourse(course.id)} title="ลบ">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Course Body */}
              {openCourse === course.id && (
                <div className="cb-course-body">
                  <button className="btn-secondary" onClick={() => handleAddUnit(course.id)}>
                    <Plus size={14} /> เพิ่มหน่วยการเรียน
                  </button>

                  {course.units.length === 0 ? (
                    <p style={{ color: '#6b7280', fontStyle: 'italic', marginTop: '1rem' }}>
                      ยังไม่มีหน่วยการเรียน — กดปุ่มด้านบนเพื่อเพิ่ม
                    </p>
                  ) : (
                    <div className="cb-units">
                      {course.units.map((unit) => (
                        <div key={unit.id} className="cb-unit">
                          <div
                            className="cb-unit-head"
                            onClick={() =>
                              setOpenUnit(openUnit === unit.id ? null : unit.id)
                            }
                          >
                            <div className="cb-unit-head-left">
                              {openUnit === unit.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span className="unit-no-badge">{unit.no}</span>
                              {editingUnit === unit.id ? (
                                <UnitEditForm
                                  unit={unit}
                                  onSave={(patch) => handleSaveUnit(course.id, unit.id, patch)}
                                  onCancel={() => setEditingUnit(null)}
                                />
                              ) : (
                                <div>
                                  <strong>{unit.title}</strong>
                                  <div className="cb-unit-stats">
                                    <span><FileText size={11}/> {unit.slides.length}</span>
                                    <span><Video size={11}/> {unit.links.filter(l => l.type === 'video').length}</span>
                                    <span><Gamepad2 size={11}/> {unit.links.filter(l => l.type === 'fun').length}</span>
                                    <span><Award size={11}/> {unit.quiz.length}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            {editingUnit !== unit.id && (
                              <div className="cb-unit-actions" onClick={(e) => e.stopPropagation()}>
                                <button className="cb-icon-btn" onClick={() => setEditingUnit(unit.id)}>
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  className="cb-icon-btn danger"
                                  onClick={() => {
                                    if (confirm('ลบหน่วยนี้?')) {
                                      deleteUnit(course.id, unit.id);
                                      refresh();
                                    }
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>

                          {openUnit === unit.id && (
                            <UnitContentEditor
                              courseId={course.id}
                              unit={unit}
                              onChange={refresh}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============= Course edit form =============
const CourseEditForm: React.FC<{
  course: CustomCourse;
  onSave: (patch: Partial<CustomCourse>) => void;
  onCancel: () => void;
}> = ({ course, onSave, onCancel }) => {
  const [title, setTitle] = useState(course.title);
  const [emoji, setEmoji] = useState(course.emoji);
  const [description, setDescription] = useState(course.description);
  const [level, setLevel] = useState(course.level || '');
  return (
    <div className="cb-edit-form" onClick={(e) => e.stopPropagation()}>
      <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="📚" style={{ width: 60 }} />
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ชื่อรายวิชา" style={{ flex: 1 }} />
      <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="ระดับ เช่น ป.1-3" style={{ width: 120 }} />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="คำอธิบาย" style={{ flex: 2, minWidth: 200 }} />
      <button className="btn-export" onClick={() => onSave({ title, emoji, description, level })}>
        <Save size={14} />
      </button>
      <button className="btn-secondary" onClick={onCancel}><X size={14} /></button>
    </div>
  );
};

const UnitEditForm: React.FC<{
  unit: CustomUnit;
  onSave: (patch: Partial<CustomUnit>) => void;
  onCancel: () => void;
}> = ({ unit, onSave, onCancel }) => {
  const [no, setNo] = useState(unit.no);
  const [title, setTitle] = useState(unit.title);
  const [intro, setIntro] = useState(unit.intro || '');
  const [topics, setTopics] = useState((unit.topics || []).join(', '));
  return (
    <div className="cb-edit-form" onClick={(e) => e.stopPropagation()}>
      <input type="number" value={no} onChange={(e) => setNo(parseInt(e.target.value) || 1)} style={{ width: 60 }} />
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ชื่อหน่วย" style={{ flex: 1 }} />
      <input value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="แนะนำหน่วย" style={{ flex: 2 }} />
      <input value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="หัวข้อ คั่นด้วย ," style={{ flex: 2 }} />
      <button className="btn-export" onClick={() => onSave({
        no, title, intro,
        topics: topics.split(',').map(t => t.trim()).filter(Boolean),
      })}>
        <Save size={14} />
      </button>
      <button className="btn-secondary" onClick={onCancel}><X size={14} /></button>
    </div>
  );
};

// ============= Unit content editor (slides + links + quizzes) =============
const UnitContentEditor: React.FC<{
  courseId: string;
  unit: CustomUnit;
  onChange: () => void;
}> = ({ courseId, unit, onChange }) => {
  const [section, setSection] = useState<'slides' | 'links' | 'quiz'>('slides');

  return (
    <div className="cb-unit-body">
      <div className="cb-section-tabs">
        <button className={section === 'slides' ? 'active' : ''} onClick={() => setSection('slides')}>
          <FileText size={14} /> สไลด์/เนื้อหา ({unit.slides.length})
        </button>
        <button className={section === 'links' ? 'active' : ''} onClick={() => setSection('links')}>
          <LinkIcon size={14} /> ลิงก์สื่อ ({unit.links.length})
        </button>
        <button className={section === 'quiz' ? 'active' : ''} onClick={() => setSection('quiz')}>
          <Award size={14} /> แบบทดสอบ ({unit.quiz.length})
        </button>
      </div>

      {section === 'slides' && (
        <SlideEditor courseId={courseId} unit={unit} onChange={onChange} />
      )}
      {section === 'links' && (
        <LinkEditor courseId={courseId} unit={unit} onChange={onChange} />
      )}
      {section === 'quiz' && (
        <QuizEditor courseId={courseId} unit={unit} onChange={onChange} />
      )}
    </div>
  );
};

// ----- Slide Editor -----
const SlideEditor: React.FC<{
  courseId: string; unit: CustomUnit; onChange: () => void;
}> = ({ courseId, unit, onChange }) => {
  const [newSlide, setNewSlide] = useState('');
  return (
    <div>
      <div className="cb-add-row">
        <textarea
          value={newSlide}
          onChange={(e) => setNewSlide(e.target.value)}
          placeholder="พิมพ์เนื้อหาสไลด์ใหม่... (รองรับ emoji + หลายบรรทัด)"
          rows={3}
        />
        <button
          className="btn-primary"
          onClick={() => {
            if (!newSlide.trim()) return;
            addSlide(courseId, unit.id, newSlide);
            setNewSlide('');
            onChange();
          }}
        >
          <Plus size={14} /> เพิ่มสไลด์
        </button>
      </div>

      {unit.slides.length === 0 ? (
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>ยังไม่มีสไลด์</p>
      ) : (
        <div className="cb-slides-list">
          {unit.slides.map((s, i) => (
            <SlideRow
              key={i}
              text={s}
              index={i}
              onSave={(text) => { updateSlide(courseId, unit.id, i, text); onChange(); }}
              onRemove={() => { removeSlide(courseId, unit.id, i); onChange(); }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SlideRow: React.FC<{ text: string; index: number; onSave: (t: string) => void; onRemove: () => void }> = ({ text, index, onSave, onRemove }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(text);
  return (
    <div className="cb-slide-row">
      <span className="cb-slide-no">{index + 1}</span>
      {editing ? (
        <>
          <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={3} style={{ flex: 1 }} />
          <button className="btn-export" onClick={() => { onSave(val); setEditing(false); }}><Save size={14}/></button>
          <button className="btn-secondary" onClick={() => { setVal(text); setEditing(false); }}><X size={14}/></button>
        </>
      ) : (
        <>
          <div className="cb-slide-text">{text}</div>
          <button className="cb-icon-btn" onClick={() => setEditing(true)}><Edit3 size={14}/></button>
          <button className="cb-icon-btn danger" onClick={onRemove}><Trash2 size={14}/></button>
        </>
      )}
    </div>
  );
};

// ----- Link Editor -----
const LinkEditor: React.FC<{
  courseId: string; unit: CustomUnit; onChange: () => void;
}> = ({ courseId, unit, onChange }) => {
  const [type, setType] = useState<CustomLink['type']>('video');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [emoji, setEmoji] = useState('🎥');

  const submit = () => {
    if (!title.trim() || !url.trim()) {
      alert('กรอกชื่อและลิงก์ก่อน');
      return;
    }
    addLink(courseId, unit.id, { title, url, type, desc, emoji });
    setTitle(''); setUrl(''); setDesc('');
    onChange();
  };

  return (
    <div>
      <div className="cb-add-link-form">
        <select value={type} onChange={(e) => {
          const t = e.target.value as CustomLink['type'];
          setType(t);
          setEmoji(t === 'video' ? '🎥' : t === 'fun' ? '🎮' : t === 'article' ? '📰' : '🔗');
        }}>
          <option value="video">🎥 วิดีโอ</option>
          <option value="fun">🎮 เกม/กิจกรรม</option>
          <option value="article">📰 บทความ</option>
          <option value="other">🔗 อื่นๆ</option>
        </select>
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} style={{ width: 50 }} placeholder="🎥" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ชื่อสื่อ" style={{ flex: 1 }} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." style={{ flex: 2 }} />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="คำอธิบาย (ไม่บังคับ)" style={{ flex: 1 }} />
        <button className="btn-primary" onClick={submit}><Plus size={14}/> เพิ่ม</button>
      </div>

      {unit.links.length === 0 ? (
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>ยังไม่มีลิงก์สื่อ</p>
      ) : (
        <div className="cb-links-list">
          {unit.links.map((l) => {
            const icon = l.type === 'video' ? <Video size={16}/> : l.type === 'fun' ? <Gamepad2 size={16}/> : l.type === 'article' ? <BookOpen size={16}/> : <LinkIcon size={16}/>;
            return (
              <div key={l.id} className="cb-link-row">
                <span className="cb-link-emoji">{l.emoji}</span>
                <span className="cb-link-type">{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{l.title}</strong>
                  <a href={l.url} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '0.75rem', color: '#6366f1', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{l.url}</a>
                  {l.desc && <small style={{ color: '#6b7280' }}>{l.desc}</small>}
                </div>
                <button className="cb-icon-btn danger" onClick={() => { removeLink(courseId, unit.id, l.id); onChange(); }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ----- Quiz Editor -----
const QuizEditor: React.FC<{
  courseId: string; unit: CustomUnit; onChange: () => void;
}> = ({ courseId, unit, onChange }) => {
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState(['', '', '', '']);
  const [ans, setAns] = useState(0);
  const [explain, setExplain] = useState('');

  const submit = () => {
    if (!q.trim() || opts.some(o => !o.trim())) {
      alert('กรอกคำถามและตัวเลือกครบทุกข้อก่อน');
      return;
    }
    addQuiz(courseId, unit.id, { q, options: opts, answer: ans, explain });
    setQ(''); setOpts(['','','','']); setAns(0); setExplain('');
    onChange();
  };

  return (
    <div>
      <div className="cb-add-quiz-form">
        <textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="คำถาม..." rows={2} />
        {opts.map((o, i) => (
          <div key={i} className="cb-quiz-opt-row">
            <label>
              <input type="radio" checked={ans === i} onChange={() => setAns(i)} />
              <span>ข้อ {['ก','ข','ค','ง'][i]} {ans === i && '(คำตอบ)'}</span>
            </label>
            <input
              value={o}
              onChange={(e) => { const n = [...opts]; n[i] = e.target.value; setOpts(n); }}
              placeholder={`ตัวเลือกที่ ${i + 1}`}
            />
          </div>
        ))}
        <textarea value={explain} onChange={(e) => setExplain(e.target.value)} placeholder="คำอธิบายเฉลย (ไม่บังคับ)" rows={2} />
        <button className="btn-primary" onClick={submit}><Plus size={14}/> เพิ่มคำถาม</button>
      </div>

      {unit.quiz.length === 0 ? (
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>ยังไม่มีคำถาม</p>
      ) : (
        <div className="cb-quiz-list">
          {unit.quiz.map((quiz, qi) => (
            <div key={quiz.id} className="cb-quiz-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{qi + 1}. {quiz.q}</strong>
                <button className="cb-icon-btn danger" onClick={() => { removeQuiz(courseId, unit.id, quiz.id); onChange(); }}>
                  <Trash2 size={14}/>
                </button>
              </div>
              <ul>
                {quiz.options.map((o, oi) => (
                  <li key={oi} style={{ color: oi === quiz.answer ? '#22c55e' : 'inherit', fontWeight: oi === quiz.answer ? 700 : 400 }}>
                    {['ก','ข','ค','ง'][oi]}. {o} {oi === quiz.answer && '✓'}
                  </li>
                ))}
              </ul>
              {quiz.explain && <small style={{ color: '#6b7280' }}>💡 {quiz.explain}</small>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseBuilder;
