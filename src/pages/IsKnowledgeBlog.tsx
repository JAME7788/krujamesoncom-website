import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Filter,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  PlayCircle,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Sprout,
} from 'lucide-react';
import { getIsLessonSlideImages } from '../data/slideImages';

const IS_SLUG_TO_LESSON: Record<string, number> = {
  'period-1-problem-identification-and-questioning': 1,
  'period-2-hypothesis-formulation': 2,
  'period-3-problem-hypothesis-and-5-research-steps': 3,
  'period-4-experimental-design-and-variables': 4,
  'period-5-data-collection-and-instruments': 5,
  'period-6-human-knowledge-seeking-and-wisdom-skills': 6,
  'period-7-human-learning-resources': 7,
  'period-8-bibliographic-citation-and-academic-report': 8,
};

import {
  IS_BLOG_SOURCE_META,
  IS_COURSE_UNIT_STRUCTURES,
  IS_EVALUATION_BREAKDOWN,
  IS_KNOWLEDGE_BLOG_POSTS,
  IS_LEARNING_GOALS_TABLE,
  IS_PRE_POST_QUESTIONS,
  IS_STUDENT_PROJECT_EXAMPLES,
  buildPrintableIsBlogPostHtml,
  type IsBlogPost,
} from '../data/isKnowledgeBlogData';

interface IsKnowledgeBlogProps {
  embedded?: boolean;
}

type BlogTab = 'lessons' | 'syllabus' | 'quiz' | 'examples';

const IsKnowledgeBlog: React.FC<IsKnowledgeBlogProps> = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState<BlogTab>('lessons');
  const [selectedSlug, setSelectedSlug] = useState<string>(IS_KNOWLEDGE_BLOG_POSTS[0].slug);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // State สำหรับแบบทดสอบ Pre-test / Post-test 10 ข้อ
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [showTeacherKey, setShowTeacherKey] = useState(false);

  // ข้อมูลคลังสไลด์การสอนบน Google Drive (ประหยัดพื้นที่จัดเก็บบนเว็บ)
  const GOOGLE_DRIVE_SLIDES_FOLDER_URL =
    'https://drive.google.com/drive/folders/1kGE6QpzlRkDUnoydErt5XYZK1GsX05L_?usp=sharing';

  // State สำหรับคลังสไลด์ภาพ 16:9 จาก ChatGPT DALL-E 3 (Google Cloud CDN)
  const [isSlideIdx, setIsSlideIdx] = useState<number>(0);

  // รีเซ็ตหน้าสไลด์เมื่อเปลี่ยนบทเรียน (ปรับ state ระหว่าง render แทน effect)
  const [slideSlug, setSlideSlug] = useState(selectedSlug);
  if (slideSlug !== selectedSlug) {
    setSlideSlug(selectedSlug);
    setIsSlideIdx(0);
  }

  // State สำหรับกรองตัวอย่างรายงาน IS 18 เล่ม
  const [selectedRoom, setSelectedRoom] = useState<'all' | 'ม.2/1' | 'ม.2/5' | 'ม.2/10'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const allTags = useMemo(() => {
    const set = new Set<string>();
    IS_KNOWLEDGE_BLOG_POSTS.forEach((post) => post.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, []);

  const filteredPosts = useMemo(() => {
    return IS_KNOWLEDGE_BLOG_POSTS.filter((post) => {
      if (selectedTag !== 'all' && !post.tags.includes(selectedTag)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = post.title.toLowerCase().includes(q);
        const matchSub = post.subtitle.toLowerCase().includes(q);
        const matchSummary = post.summary.toLowerCase().includes(q);
        const matchWorksheet = post.worksheet.title.toLowerCase().includes(q);
        const matchSection = post.sections.some(
          (s) =>
            s.heading.toLowerCase().includes(q) ||
            (s.body ?? []).some((b) => b.toLowerCase().includes(q)) ||
            (s.bullets ?? []).some((b) => b.toLowerCase().includes(q)),
        );
        return matchTitle || matchSub || matchSummary || matchWorksheet || matchSection;
      }
      return true;
    });
  }, [searchQuery, selectedTag]);

  const activePost: IsBlogPost = useMemo(() => {
    return (
      filteredPosts.find((p) => p.slug === selectedSlug) ??
      filteredPosts[0] ??
      IS_KNOWLEDGE_BLOG_POSTS[0]
    );
  }, [filteredPosts, selectedSlug]);

  const currentIndex = useMemo(
    () => IS_KNOWLEDGE_BLOG_POSTS.findIndex((p) => p.slug === activePost.slug),
    [activePost],
  );

  const activeLessonNumber = useMemo(
    () => IS_SLUG_TO_LESSON[activePost.slug] || 1,
    [activePost.slug],
  );
  const activeSlides = useMemo(
    () => getIsLessonSlideImages(activeLessonNumber),
    [activeLessonNumber],
  );

  const filteredExamples = useMemo(() => {
    return IS_STUDENT_PROJECT_EXAMPLES.filter((ex) => {
      if (selectedRoom !== 'all' && ex.classroom !== selectedRoom) return false;
      if (selectedCategory !== 'all' && ex.category !== selectedCategory) return false;
      return true;
    });
  }, [selectedRoom, selectedCategory]);

  const handlePrintLesson = (post: IsBlogPost) => {
    const html = buildPrintableIsBlogPostHtml(post);
    const win = window.open('', '_blank', 'width=960,height=820');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const quizScore = useMemo(() => {
    let score = 0;
    IS_PRE_POST_QUESTIONS.forEach((q) => {
      if (userAnswers[q.no] === q.answerIndex) score += 1;
    });
    return score;
  }, [userAnswers]);

  return (
    <div
      style={{
        maxWidth: embedded ? '100%' : 1240,
        margin: '0 auto',
        padding: embedded ? '0.5rem 0' : '2rem 1.25rem 4rem',
      }}
    >
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #0f766e 55%, #1e40af 100%)',
          color: '#ffffff',
          borderRadius: 20,
          padding: embedded ? '1.5rem' : '2.25rem 2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 14px 34px rgba(6, 78, 59, 0.22)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ maxWidth: 820 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <span
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                📚 รหัสวิชา {IS_BLOG_SOURCE_META.courseCodeI1} & {IS_BLOG_SOURCE_META.courseCodeI2}
              </span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.28)',
                  border: '1px solid rgba(167, 243, 208, 0.5)',
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                🌱 บูรณาการ ทักษะอาชีพ 1–2 (นวัตกรรมการเกษตร IS 5 ขั้นตอน)
              </span>
            </div>
            <h1
              style={{
                margin: '0 0 8px',
                fontSize: embedded ? '1.45rem' : '1.95rem',
                fontWeight: 800,
                lineHeight: 1.28,
              }}
            >
              บล็อกคลังความรู้วิชา IS: การศึกษาค้นคว้าและสร้างองค์ความรู้ (Independent Study)
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: '0.94rem',
                color: '#d1fae5',
                lineHeight: 1.6,
              }}
            >
              รวมเนื้อหาบทเรียนรายคาบ ใบความรู้ ใบงานที่ 1–7 บทเรียนการอ้างอิงบรรณานุกรม
              โครงสร้างรายวิชา K-P-A-C แบบทดสอบก่อน–หลังเรียน 10 ข้อ และคลังตัวอย่างเล่มรายงาน IS จริง 18 เรื่อง
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
            <a
              href={IS_BLOG_SOURCE_META.sourceUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={15} /> แหล่งอ้างอิงต้นฉบับ (ห้องเรียนครูดาว)
            </a>
            {!embedded && (
              <Link
                to="/courses"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  borderRadius: 10,
                  background: '#ffffff',
                  color: '#065f46',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <ChevronLeft size={15} /> กลับหน้ารวมคอร์สเรียน
              </Link>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 10,
            marginTop: '1.25rem',
          }}
        >
          {[
            { label: 'บทความเนื้อหารายคาบ', value: `${IS_KNOWLEDGE_BLOG_POSTS.length} บทเรียน + ใบงาน` },
            { label: 'หน่วยการเรียนรู้ I20201', value: '3 หน่วย (40 ชั่วโมง / 100 คะแนน)' },
            { label: 'แบบทดสอบวัดความรู้ IS', value: `${IS_PRE_POST_QUESTIONS.length} ข้อ (Pre/Post-test)` },
            { label: 'ตัวอย่างรายงาน IS จริง', value: `${IS_STUDENT_PROJECT_EXAMPLES.length} เล่ม (3 ห้องเรียน)` },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: '10px 14px',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: '#a7f3d0' }}>{stat.label}</div>
              <div style={{ fontSize: '0.96rem', fontWeight: 800, marginTop: 2 }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: '1.5rem',
          background: '#f1f5f9',
          padding: 6,
          borderRadius: 14,
        }}
      >
        {[
          {
            id: 'lessons' as BlogTab,
            label: `📰 บทความเนื้อหาประจำคาบ & ใบงาน (${IS_KNOWLEDGE_BLOG_POSTS.length} บท)`,
            icon: <BookOpen size={16} />,
          },
          {
            id: 'syllabus' as BlogTab,
            label: '📋 โครงสร้างวิชา I20201 / เป้าหมาย K-P-A-C / การวัดผล',
            icon: <FileText size={16} />,
          },
          {
            id: 'quiz' as BlogTab,
            label: `🧪 แบบทดสอบก่อน–หลังเรียน (${IS_PRE_POST_QUESTIONS.length} ข้อ)`,
            icon: <ClipboardCheck size={16} />,
          },
          {
            id: 'examples' as BlogTab,
            label: `🏆 ตัวอย่างเล่มรายงาน IS (${IS_STUDENT_PROJECT_EXAMPLES.length} เรื่อง)`,
            icon: <FolderOpen size={16} />,
          },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 1 auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: active ? '#059669' : 'transparent',
                color: active ? '#ffffff' : '#334155',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: active ? '0 4px 12px rgba(5, 150, 105, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: บทความเนื้อหาประจำคาบ & ใบงาน (8 บทเรียน) */}
      {/* ===================================================================== */}
      {activeTab === 'lessons' && (
        <div>
          {/* Filter & Search Bar */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '12px 16px',
              marginBottom: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 280px' }}>
              <Search size={18} style={{ color: '#64748b' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาบทเรียน เช่น สมมติฐาน, ตัวแปรต้น, ปฐมภูมิ, 10 ขั้นตอน, บรรณานุกรม..."
                style={{
                  width: '100%',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.88rem',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <Filter size={15} style={{ color: '#64748b' }} />
              <button
                type="button"
                onClick={() => setSelectedTag('all')}
                style={{
                  padding: '5px 11px',
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: selectedTag === 'all' ? '#059669' : '#cbd5e1',
                  background: selectedTag === 'all' ? '#ecfdf5' : '#ffffff',
                  color: selectedTag === 'all' ? '#065f46' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ทั้งหมด ({IS_KNOWLEDGE_BLOG_POSTS.length})
              </button>
              {allTags.slice(0, 7).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag === selectedTag ? 'all' : tag)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: selectedTag === tag ? '#059669' : '#cbd5e1',
                    background: selectedTag === tag ? '#ecfdf5' : '#ffffff',
                    color: selectedTag === tag ? '#065f46' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Period / Lesson Selector Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 10,
              marginBottom: '1.5rem',
            }}
          >
            {filteredPosts.map((post) => {
              const isSelected = post.slug === activePost.slug;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedSlug(post.slug)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                    background: isSelected ? '#ecfdf5' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 6px 16px rgba(5, 150, 105, 0.14)' : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: isSelected ? '#047857' : '#2563eb',
                        background: isSelected ? '#d1fae5' : '#eff6ff',
                        padding: '2px 8px',
                        borderRadius: 999,
                      }}
                    >
                      {post.periodLabel}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      ⏱ {post.readingTimeMinutes} นาที
                    </span>
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: '#0f172a',
                      lineHeight: 1.35,
                      marginBottom: 4,
                    }}
                  >
                    {post.title}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#475569' }}>
                    📝 {post.worksheet.worksheetNo}: {post.worksheet.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Blog Post Article Reader */}
          <article
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 18,
              padding: embedded ? '1.25rem' : '2rem',
              boxShadow: '0 8px 26px rgba(15, 23, 42, 0.05)',
            }}
          >
            {/* Post Header */}
            <div
              style={{
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span
                    style={{
                      background: '#059669',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    {activePost.periodLabel}
                  </span>
                  <span
                    style={{
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    {activePost.unitLabel}
                  </span>
                  <span
                    style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    {activePost.isStepBadge}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handlePrintLesson(activePost)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid #059669',
                    background: '#ecfdf5',
                    color: '#065f46',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={16} /> พิมพ์ใบความรู้ + {activePost.worksheet.worksheetNo} (A4)
                </button>
              </div>

              <h2
                style={{
                  margin: '0 0 6px',
                  fontSize: '1.55rem',
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                {activePost.title}
              </h2>
              <p style={{ margin: '0 0 12px', fontSize: '0.98rem', color: '#475569' }}>
                {activePost.subtitle}
              </p>

              {/* Summary Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid rgba(37, 99, 235, 0.45)',
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  lineHeight: 1.6,
                }}
              >
                <strong>💡 สรุปสาระสำคัญประจำคาบ:</strong> {activePost.summary}
              </div>

              {/* Agricultural Innovation Connection Box */}
              <div
                style={{
                  marginTop: 10,
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                  border: '1px solid #86efac',
                  borderRadius: 10,
                  padding: '12px 16px',
                  fontSize: '0.88rem',
                  color: '#065f46',
                  lineHeight: 1.6,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <Sprout size={20} style={{ flexShrink: 0, marginTop: 2, color: '#059669' }} />
                <div>
                  <strong>เชื่อมโยงวิชาทักษะอาชีพ 1–2 (นวัตกรรมการเกษตร & Smart Farming):</strong>{' '}
                  {activePost.agriInnovationConnection}
                </div>
              </div>
            </div>

            {/* Google Drive Slides Presentation Section (Zero Disk Bloat - ChatGPT DALL-E 3 16:9) */}
            {activeSlides.length > 0 && (
              <div
                style={{
                  marginBottom: '2rem',
                  background: 'linear-gradient(145deg, #0b1329 0%, #111e3b 100%)',
                  borderRadius: 18,
                  padding: embedded ? '1rem' : '1.35rem',
                  color: '#ffffff',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
                  border: '1px solid #1e3a8a',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <Sparkles size={12} /> ChatGPT DALL-E 3 • 16:9
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Google Drive Cloud CDN (ไม่เปลืองพื้นที่โปรเจกต์)
                      </span>
                    </div>
                    <h3 style={{ margin: '6px 0 2px', fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                      สไลด์ประกอบการสอน: {activePost.periodLabel}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1' }}>
                      {activePost.title} (สไลด์ที่ {isSlideIdx + 1} จาก {activeSlides.length})
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <a
                      href={GOOGLE_DRIVE_SLIDES_FOLDER_URL}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 10,
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #059669',
                        color: '#34d399',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                      title="เปิดดูโฟลเดอร์สไลด์ต้นฉบับบน Google Drive"
                    >
                      <FolderOpen size={16} /> โฟลเดอร์ Google Drive ➔
                    </a>
                  </div>
                </div>

                {/* 16:9 Slide Viewport */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: '#020617',
                    border: '1px solid #1e293b',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={activeSlides[isSlideIdx]}
                    alt={`สไลด์ที่ ${isSlideIdx + 1} จาก ${activeSlides.length} - ${activePost.title}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                    loading="eager"
                    onError={(e) => {
                      const currentUrl = activeSlides[isSlideIdx] || '';
                      const m = currentUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                      if (m && !e.currentTarget.src.includes('drive.usercontent.google.com')) {
                        e.currentTarget.src = `https://drive.usercontent.google.com/download?id=${m[1]}&export=view`;
                      }
                    }}
                  />

                  {/* Left / Right Nav Overlays */}
                  {isSlideIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsSlideIdx((prev) => Math.max(0, prev - 1))}
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        zIndex: 10,
                      }}
                      aria-label="สไลด์ก่อนหน้า"
                      title="สไลด์ก่อนหน้า"
                    >
                      <ChevronLeft size={24} />
                    </button>
                  )}

                  {isSlideIdx < activeSlides.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setIsSlideIdx((prev) => Math.min(activeSlides.length - 1, prev + 1))}
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        zIndex: 10,
                      }}
                      aria-label="สไลด์ถัดไป"
                      title="สไลด์ถัดไป"
                    >
                      <ChevronRight size={24} />
                    </button>
                  )}

                  {/* Slide Counter Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      background: 'rgba(2, 6, 23, 0.8)',
                      backdropFilter: 'blur(6px)',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#6ee7b7',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    สไลด์ {isSlideIdx + 1} / {activeSlides.length}
                  </div>
                </div>

                {/* 6 Quick Jump Slide Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {activeSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setIsSlideIdx(idx)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: idx === isSlideIdx ? '2px solid #10b981' : '1px solid #334155',
                        background: idx === isSlideIdx ? '#10b981' : 'rgba(30, 41, 59, 0.7)',
                        color: idx === isSlideIdx ? '#064e3b' : '#cbd5e1',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: idx === isSlideIdx ? '0 0 12px rgba(16, 185, 129, 0.35)' : 'none',
                      }}
                      title={`ดูสไลด์ที่ ${idx + 1}`}
                    >
                      สไลด์ {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: '1.35rem' }}>
              {activePost.sections.map((sec, idx) => (
                <section
                  key={idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '1.15rem 1.35rem',
                  }}
                >
                  <h3
                    style={{
                      margin: '0 0 10px',
                      fontSize: '1.12rem',
                      fontWeight: 800,
                      color: '#065f46',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Sparkles size={17} style={{ color: '#059669' }} />
                    {sec.heading}
                  </h3>

                  {sec.body &&
                    sec.body.map((p, pIdx) => (
                      <p
                        key={pIdx}
                        style={{
                          margin: '0 0 10px',
                          fontSize: '0.94rem',
                          color: '#1e293b',
                          lineHeight: 1.7,
                        }}
                      >
                        {p}
                      </p>
                    ))}

                  {sec.bullets && (
                    <ul
                      style={{
                        margin: '6px 0 10px 20px',
                        padding: 0,
                        display: 'grid',
                        gap: 6,
                        fontSize: '0.92rem',
                        color: '#1e293b',
                        lineHeight: 1.65,
                      }}
                    >
                      {sec.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  )}

                  {sec.examples && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 10,
                        marginTop: 10,
                      }}
                    >
                      {sec.examples.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: 10,
                            padding: '10px 14px',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: '#1e3a8a',
                              marginBottom: 6,
                            }}
                          >
                            📌 {ex.title}
                          </div>
                          <ul
                            style={{
                              margin: '0 0 0 18px',
                              padding: 0,
                              fontSize: '0.86rem',
                              color: '#334155',
                              display: 'grid',
                              gap: 4,
                            }}
                          >
                            {ex.items.map((it, itIdx) => (
                              <li key={itIdx}>{it}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {sec.highlightBox && (
                    <div
                      style={{
                        marginTop: 12,
                        background: '#fffbeb',
                        border: '1px solid #fcd34d',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: '0.88rem',
                        color: '#92400e',
                      }}
                    >
                      <strong>⭐ {sec.highlightBox.title}:</strong> {sec.highlightBox.content}
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Videos & PDF Attachments */}
            {(activePost.videos?.length || activePost.pdfAttachment) && (
              <div
                style={{
                  marginTop: '1.5rem',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 14,
                  padding: '1.15rem 1.35rem',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 10px',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#1e3a8a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <PlayCircle size={18} /> สื่อวิดีโอและเอกสารประกอบการเรียนประจำคาบ
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 12,
                  }}
                >
                  {activePost.videos?.map((v) => (
                    <div
                      key={v.youtubeId}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                          🎬 {v.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                          ช่อง: {v.channel}
                        </div>
                      </div>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#2563eb',
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={14} /> เปิดดูวิดีโอบน YouTube
                      </a>
                    </div>
                  ))}

                  {activePost.pdfAttachment && (
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                          📄 {activePost.pdfAttachment.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                          ไฟล์เอกสารประกอบการเรียน PDF ต้นฉบับ
                        </div>
                      </div>
                      <a
                        href={activePost.pdfAttachment.driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#059669',
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={14} /> เปิดไฟล์ PDF (Google Drive)
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Worksheet Box */}
            <div
              style={{
                marginTop: '1.5rem',
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '2px solid #f59e0b',
                borderRadius: 16,
                padding: '1.25rem 1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div>
                  <span
                    style={{
                      background: '#d97706',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: '0.76rem',
                      fontWeight: 800,
                    }}
                  >
                    📝 {activePost.worksheet.worksheetNo}
                  </span>
                  <h3
                    style={{
                      margin: '6px 0 0',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: '#78350f',
                    }}
                  >
                    ใบงานเรื่อง {activePost.worksheet.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handlePrintLesson(activePost)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#b45309',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={15} /> พิมพ์ใบงานนี้ (A4)
                </button>
              </div>

              <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#92400e', fontWeight: 600 }}>
                คำชี้แจง: {activePost.worksheet.instructions}
              </p>

              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 12,
                  padding: '12px 16px',
                  border: '1px solid #fcd34d',
                }}
              >
                <ol
                  style={{
                    margin: '0 0 0 18px',
                    padding: 0,
                    display: 'grid',
                    gap: 8,
                    fontSize: '0.9rem',
                    color: '#1e293b',
                    lineHeight: 1.6,
                  }}
                >
                  {activePost.worksheet.questions.map((q, qIdx) => (
                    <li key={qIdx} style={{ fontWeight: 600 }}>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>

              <div style={{ marginTop: 10, fontSize: '0.82rem', color: '#78350f' }}>
                📌 <strong>การส่งงาน:</strong> {activePost.worksheet.submissionNote}
              </div>
            </div>

            {/* Prev / Next Lesson Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              {currentIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedSlug(IS_KNOWLEDGE_BLOG_POSTS[currentIndex - 1].slug)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={16} /> ก่อนหน้า: {IS_KNOWLEDGE_BLOG_POSTS[currentIndex - 1].periodLabel}
                </button>
              ) : (
                <div />
              )}

              {currentIndex < IS_KNOWLEDGE_BLOG_POSTS.length - 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedSlug(IS_KNOWLEDGE_BLOG_POSTS[currentIndex + 1].slug)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  บทถัดไป: {IS_KNOWLEDGE_BLOG_POSTS[currentIndex + 1].periodLabel} <ChevronRight size={16} />
                </button>
              )}
            </div>
          </article>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: โครงสร้างรายวิชา I20201 / เป้าหมาย K-P-A-C / การวัดผล 100 คะแนน */}
      {/* ===================================================================== */}
      {activeTab === 'syllabus' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* คำชี้แจงสำหรับนักเรียน & คำอธิบายรายวิชา */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 16,
              padding: '1.5rem',
            }}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: '1.3rem', color: '#065f46' }}>
              📌 คำชี้แจงในการเรียนออนไลน์ & คำอธิบายรายวิชา ({IS_BLOG_SOURCE_META.courseCodeI1})
            </h2>

            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: '1.25rem',
              }}
            >
              <strong style={{ color: '#065f46', fontSize: '0.92rem' }}>
                แนวปฏิบัติสำหรับนักเรียน (6 ขั้นตอน):
              </strong>
              <ol
                style={{
                  margin: '8px 0 0 20px',
                  padding: 0,
                  display: 'grid',
                  gap: 4,
                  fontSize: '0.88rem',
                  color: '#1e293b',
                }}
              >
                {IS_BLOG_SOURCE_META.studentInstructions.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ol>
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', color: '#1e3a8a' }}>
              คำอธิบายรายวิชา ({IS_BLOG_SOURCE_META.credits})
            </h3>
            {IS_BLOG_SOURCE_META.courseDescriptionParagraphs.map((p, idx) => (
              <p
                key={idx}
                style={{
                  margin: '0 0 10px',
                  fontSize: '0.92rem',
                  color: '#334155',
                  lineHeight: 1.7,
                }}
              >
                {p}
              </p>
            ))}

            <h3 style={{ margin: '1rem 0 8px', fontSize: '1.05rem', color: '#1e3a8a' }}>
              ผลการเรียนรู้ (รวม {IS_BLOG_SOURCE_META.learningOutcomes.length} ข้อ)
            </h3>
            <ol
              style={{
                margin: '0 0 0 20px',
                padding: 0,
                display: 'grid',
                gap: 6,
                fontSize: '0.9rem',
                color: '#1e293b',
              }}
            >
              {IS_BLOG_SOURCE_META.learningOutcomes.map((lo, idx) => (
                <li key={idx}>{lo}</li>
              ))}
            </ol>
          </div>

          {/* โครงสร้างรายวิชา 3 หน่วยการเรียนรู้ */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 16,
              padding: '1.5rem',
            }}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: '1.3rem', color: '#065f46' }}>
              📊 โครงสร้างรายวิชา I20201 (3 หน่วยการเรียนรู้ — 40 ชั่วโมง / 100 คะแนน)
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.86rem',
                }}
              >
                <thead>
                  <tr style={{ background: '#ecfdf5', color: '#065f46' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '10px', width: 90 }}>หน่วยที่</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '10px', width: 180 }}>ชื่อหน่วยการเรียนรู้</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '10px' }}>ผลการเรียนรู้</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '10px' }}>สาระสำคัญ</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '10px', width: 90 }}>เวลา (ชม.)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '10px', width: 100 }}>น้ำหนักคะแนน</th>
                  </tr>
                </thead>
                <tbody>
                  {IS_COURSE_UNIT_STRUCTURES.map((u) => (
                    <tr key={u.unitNo}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 700 }}>
                        หน่วยที่ {u.unitNo}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px', fontWeight: 700, color: '#0f172a' }}>
                        {u.title}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>
                        <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
                          {u.learningOutcomes.map((lo, i) => (
                            <li key={i}>{lo}</li>
                          ))}
                        </ul>
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>
                        <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
                          {u.coreConcepts.map((cc, i) => (
                            <li key={i}>{cc}</li>
                          ))}
                        </ul>
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 700 }}>
                        {u.hours}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 700, color: '#059669' }}>
                        {u.scoreWeight}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ตารางเป้าหมายการเรียนรู้ K - P - A - C - เศรษฐกิจพอเพียง */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 16,
              padding: '1.5rem',
            }}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: '1.3rem', color: '#065f46' }}>
              🎯 ตารางวิเคราะห์เป้าหมายการเรียนรู้ (K / P / A / สมรรถนะ C / เศรษฐกิจพอเพียง)
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#eff6ff', color: '#1e3a8a' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8, width: 55 }}>ข้อที่</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>ผลการเรียนรู้</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>ความรู้ (K)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>กระบวนการ (P)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>คุณลักษณะ (A)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>สมรรถนะ (C)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>เศรษฐกิจพอเพียง</th>
                  </tr>
                </thead>
                <tbody>
                  {IS_LEARNING_GOALS_TABLE.map((row) => (
                    <tr key={row.outcomeNo}>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center', fontWeight: 700 }}>
                        {row.outcomeNo}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, fontWeight: 600 }}>
                        {row.indicatorText}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{row.knowledgeK}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{row.processP}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{row.attitudeA.join(', ')}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{row.competencyC.join(', ')}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>
                        {row.sufficiencyEconomy.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ตารางการวัดและประเมินผล 30 : 20 : 30 : 20 = 100 คะแนน */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 16,
              padding: '1.5rem',
            }}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: '1.3rem', color: '#065f46' }}>
              ⚖️ อัตราส่วนคะแนนและการวัดผล (ก่อนกลางภาค 30 : กลางภาค 20 : หลังกลางภาค 30 : ปลายภาค 20 = 100)
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#fef3c7', color: '#78350f' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8, width: 60 }}>ข้อที่</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>ผลการเรียนรู้</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>ก่อนกลางภาค (30)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>กลางภาค (20)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>หลังกลางภาค (30)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>ปลายภาค (20)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8, width: 80 }}>รวม (100)</th>
                  </tr>
                </thead>
                <tbody>
                  {IS_EVALUATION_BREAKDOWN.map((row) => (
                    <tr key={row.outcomeNo}>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center', fontWeight: 700 }}>
                        {row.outcomeNo}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{row.outcomeText}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center' }}>
                        {row.beforeMidterm}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center' }}>
                        {row.midterm}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center' }}>
                        {row.afterMidterm}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center' }}>
                        {row.finalExam}
                      </td>
                      <td
                        style={{
                          border: '1px solid #cbd5e1',
                          padding: 8,
                          textAlign: 'center',
                          fontWeight: 800,
                          color: '#059669',
                        }}
                      >
                        {row.totalScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: แบบทดสอบก่อนเรียน–หลังเรียน (Pre-test / Post-test 10 ข้อ) */}
      {/* ===================================================================== */}
      {activeTab === 'quiz' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 16,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#065f46' }}>
                🧪 แบบทดสอบก่อนเรียน–หลังเรียน รายวิชา I20201 (จำนวน 10 ข้อ)
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#475569' }}>
                ข้อสอบจริงจากแบบฟอร์มออนไลน์วิชาการศึกษาค้นคว้าและสร้างองค์ความรู้ (เลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว)
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowTeacherKey((prev) => !prev)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: showTeacherKey ? '#fef3c7' : '#ffffff',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <HelpCircle size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                {showTeacherKey ? 'ซ่อนเฉลยครู' : 'ดูเฉลยและคำอธิบาย'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserAnswers({});
                  setSubmittedQuiz(false);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                เริ่มทำใหม่
              </button>
            </div>
          </div>

          {submittedQuiz && (
            <div
              style={{
                background: quizScore >= 7 ? '#ecfdf5' : '#fffbeb',
                border: `2px solid ${quizScore >= 7 ? '#10b981' : '#f59e0b'}`,
                borderRadius: 12,
                padding: '12px 18px',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                🎯 คะแนนของคุณ: {quizScore} / {IS_PRE_POST_QUESTIONS.length} คะแนน (
                {Math.round((quizScore / IS_PRE_POST_QUESTIONS.length) * 100)}%)
              </div>
              <div style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 600 }}>
                {quizScore >= 7
                  ? '🌟 ยอดเยี่ยม! ผ่านเกณฑ์มาตรฐาน 70% พร้อมลุยโครงงาน IS'
                  : '💡 แนะนำให้ทบทวนบทความคาบที่ 1–7 แล้วลองทำใหม่อีกครั้ง'}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 14 }}>
            {IS_PRE_POST_QUESTIONS.map((q) => {
              const selected = userAnswers[q.no];
              const reveal = submittedQuiz || showTeacherKey;
              return (
                <div
                  key={q.no}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '14px 16px',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: 10 }}>
                    ข้อที่ {q.no}. {q.question}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 8,
                    }}
                  >
                    {q.choices.map((choice, cIdx) => {
                      const isPicked = selected === cIdx;
                      const isAnswer = q.answerIndex === cIdx;
                      let bg = '#ffffff';
                      let border = '#cbd5e1';
                      if (reveal && isAnswer) {
                        bg = '#dcfce7';
                        border = '#16a34a';
                      } else if (reveal && isPicked && !isAnswer) {
                        bg = '#fee2e2';
                        border = '#dc2626';
                      } else if (isPicked) {
                        bg = '#eff6ff';
                        border = '#2563eb';
                      }

                      return (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() =>
                            setUserAnswers((prev) => ({
                              ...prev,
                              [q.no]: cIdx,
                            }))
                          }
                          style={{
                            textAlign: 'left',
                            padding: '9px 12px',
                            borderRadius: 8,
                            border: `1.5px solid ${border}`,
                            background: bg,
                            fontSize: '0.88rem',
                            fontWeight: isPicked || (reveal && isAnswer) ? 700 : 500,
                            color: '#1e293b',
                            cursor: 'pointer',
                          }}
                        >
                          {['ก', 'ข', 'ค', 'ง'][cIdx]}. {choice}
                        </button>
                      );
                    })}
                  </div>
                  {reveal && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: '0.84rem',
                        color: '#065f46',
                        background: '#ecfdf5',
                        padding: '6px 10px',
                        borderRadius: 8,
                      }}
                    >
                      <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      <strong>เฉลยข้อ {['ก', 'ข', 'ค', 'ง'][q.answerIndex]}:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setSubmittedQuiz(true)}
              style={{
                padding: '11px 28px',
                borderRadius: 12,
                border: 'none',
                background: '#059669',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.96rem',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(5, 150, 105, 0.25)',
              }}
            >
              ส่งคำตอบและตรวจผลคะแนนทันที
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: ตัวอย่างเล่มรายงาน IS นักเรียน 18 เรื่อง (I20202) */}
      {/* ===================================================================== */}
      {activeTab === 'examples' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 16,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#065f46' }}>
                🏆 คลังตัวอย่างเล่มรายงานการศึกษาค้นคว้า (IS2 / รหัสวิชา {IS_BLOG_SOURCE_META.courseCodeI2})
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#475569' }}>
                ตัวอย่างรูปเล่มรายงานฉบับสมบูรณ์ 5 บท จำนวน {IS_STUDENT_PROJECT_EXAMPLES.length} เรื่อง
                สำหรับเป็นแนวทางให้นักเรียนตั้งหัวข้อโครงงาน IS และนวัตกรรมการเกษตร/ผลิตภัณฑ์สมุนไพร
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(['all', 'ม.2/1', 'ม.2/5', 'ม.2/10'] as const).map((room) => (
                <button
                  key={room}
                  type="button"
                  onClick={() => setSelectedRoom(room)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: selectedRoom === room ? '#059669' : '#cbd5e1',
                    background: selectedRoom === room ? '#ecfdf5' : '#ffffff',
                    color: selectedRoom === room ? '#065f46' : '#334155',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {room === 'all' ? 'ทุกห้องเรียน (18)' : `ห้อง ${room}`}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.25rem' }}>
            {[
              'all',
              'การเกษตรและพืชพรรณ',
              'ผลิตภัณฑ์สมุนไพรและของใช้',
              'อาหารและเครื่องดื่มเพื่อสุขภาพ',
              'สังคมและพฤติกรรม',
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? '#2563eb' : '#e2e8f0',
                  background: selectedCategory === cat ? '#eff6ff' : '#f8fafc',
                  color: selectedCategory === cat ? '#1d4ed8' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {cat === 'all' ? 'ทุกหมวดหมู่โครงงาน' : cat}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: 12,
            }}
          >
            {filteredExamples.map((ex) => (
              <div
                key={ex.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px 16px',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                    <span
                      style={{
                        background: '#d1fae5',
                        color: '#065f46',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: '0.74rem',
                        fontWeight: 800,
                      }}
                    >
                      <GraduationCap size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                      {ex.classroom}
                    </span>
                    <span
                      style={{
                        background: '#eff6ff',
                        color: '#1e40af',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                      }}
                    >
                      {ex.category}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#0f172a', lineHeight: 1.4 }}>
                    📘 โครงงานเรื่อง: {ex.title}
                  </div>
                </div>

                <a
                  href={ex.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#059669',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} /> เปิดดูรูปเล่มรายงานฉบับเต็ม (Google Drive)
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IsKnowledgeBlog;
