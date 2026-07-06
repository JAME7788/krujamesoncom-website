import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Layers, Search, ShieldAlert } from 'lucide-react';
import { grades } from '../data/curriculum';
import { loadCourses } from '../services/contentService';
import {
  fetchUnlockedUnits,
  getUnlockedUnits,
  saveUnlockedUnits,
  subscribeUnlockedUnits,
  type UnitUnlockMap,
} from '../services/unitLockService';
import {
  CLASSROOMS,
  fetchCourseAccessSettings,
  getCourseIdsForClassroom,
  getCourseAccessSettings,
  saveCourseAccessSettings,
  setMiddleSchoolCsOnly,
  subscribeCourseAccessSettings,
  type CourseAccessSettings,
} from '../services/courseAccessService';
import type { Subject } from '../services/gradeService';
import { useToast } from './Toast';

interface UnifiedCourse {
  id: string;
  emoji: string;
  title: string;
  isCustom: boolean;
  units: { no: number; title: string }[];
}

const LessonLockManager: React.FC = () => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'primary' | 'secondary' | 'custom'>('all');
  const [unlockedMap, setUnlockedMap] = useState<UnitUnlockMap>(() => getUnlockedUnits());
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [courseAccessSettings, setCourseAccessSettings] = useState<CourseAccessSettings>(() => getCourseAccessSettings());
  const [savingAccess, setSavingAccess] = useState(false);

  const allCourses = useMemo<UnifiedCourse[]>(() => {
    const customCourses = loadCourses();
    return [
      ...grades.map((g) => ({
        id: g.id,
        emoji: g.emoji,
        title: g.title,
        isCustom: false,
        units: g.units || [],
      })),
      ...customCourses.map((c) => ({
        id: c.id,
        emoji: c.emoji,
        title: c.title,
        isCustom: true,
        units: c.units.map((u) => ({ no: u.no, title: u.title })),
      })),
    ];
  }, []);

  const courseById = useMemo(() => new Map(allCourses.map((course) => [course.id, course])), [allCourses]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(allCourses[0]?.id || '');

  useEffect(() => {
    let alive = true;

    fetchUnlockedUnits().then((data) => {
      if (alive) setUnlockedMap(data);
    });

    const unsubscribe = subscribeUnlockedUnits((data) => {
      if (alive) setUnlockedMap(data);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let alive = true;

    fetchCourseAccessSettings().then((settings) => {
      if (alive) setCourseAccessSettings(settings);
    });

    const unsubscribe = subscribeCourseAccessSettings((settings) => {
      if (alive) setCourseAccessSettings(settings);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const getCourseCategory = (id: string, isCustom: boolean) => {
    if (isCustom) return 'custom';
    if (id.startsWith('p')) return 'primary';
    if (id.startsWith('m')) return 'secondary';
    return 'primary';
  };

  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      const matchSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
      const category = getCourseCategory(course.id, course.isCustom);
      const matchFilter = activeFilter === 'all' || category === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [allCourses, searchTerm, activeFilter]);

  const effectiveSelectedCourseId = filteredCourses.some((course) => course.id === selectedCourseId)
    ? selectedCourseId
    : filteredCourses[0]?.id || '';

  const selectedCourse = useMemo(
    () => allCourses.find((c) => c.id === effectiveSelectedCourseId),
    [allCourses, effectiveSelectedCourseId],
  );

  const persistMap = async (
    nextMap: UnitUnlockMap,
    previousMap: UnitUnlockMap,
    successMessage: string,
    successType: 'success' | 'info' = 'success',
  ) => {
    try {
      const saved = await saveUnlockedUnits(nextMap);
      setUnlockedMap(saved);
      toast.show(successMessage, successType);
    } catch (error) {
      console.error('Failed to save unit lock state', error);
      setUnlockedMap(previousMap);
      toast.show('บันทึกสถานะปลดล็อกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const handleToggleLock = async (courseId: string, unitNo: number) => {
    if (savingKey) return;

    if (unitNo === 1) {
      toast.show('หน่วยที่ 1 เปิดให้นักเรียนเรียนตลอดเวลาอยู่แล้ว', 'info');
      return;
    }

    const currentlyUnlocked = (unlockedMap[courseId] || []).includes(unitNo);
    const nextUnlockState = !currentlyUnlocked;
    const previousMap = unlockedMap;
    const nextUnits = nextUnlockState
      ? Array.from(new Set([...(unlockedMap[courseId] || []), unitNo])).sort((a, b) => a - b)
      : (unlockedMap[courseId] || []).filter((no) => no !== unitNo);
    const nextMap = { ...unlockedMap, [courseId]: nextUnits };

    setUnlockedMap(nextMap);
    setSavingKey(`${courseId}_${unitNo}`);

    await persistMap(
      nextMap,
      previousMap,
      nextUnlockState
        ? `ปลดล็อกหน่วยที่ ${unitNo} ของวิชา "${selectedCourse?.title}" สำเร็จ`
        : `ล็อกหน่วยที่ ${unitNo} ของวิชา "${selectedCourse?.title}" สำเร็จ`,
      nextUnlockState ? 'success' : 'info',
    );
  };

  const handleUnlockAll = async (course: UnifiedCourse) => {
    if (savingKey) return;

    const unitNos = course.units.map((unit) => unit.no);
    const nextMap = { ...unlockedMap, [course.id]: Array.from(new Set(unitNos)).sort((a, b) => a - b) };
    const previousMap = unlockedMap;

    setUnlockedMap(nextMap);
    setSavingKey(`${course.id}_all`);
    await persistMap(nextMap, previousMap, `ปลดล็อกทุกหน่วยเรียนในวิชา "${course.title}" แล้ว`);
  };

  const handleLockAll = async (course: UnifiedCourse) => {
    if (savingKey) return;

    const nextMap = { ...unlockedMap, [course.id]: [1] };
    const previousMap = unlockedMap;

    setUnlockedMap(nextMap);
    setSavingKey(`${course.id}_all`);
    await persistMap(
      nextMap,
      previousMap,
      `ล็อกทุกหน่วยเรียนของวิชา "${course.title}" แล้ว ยกเว้นหน่วยที่ 1`,
      'info',
    );
  };

  const saveAccess = async (next: CourseAccessSettings, message: string) => {
    if (savingAccess) return;
    const previous = courseAccessSettings;
    setCourseAccessSettings(next);
    setSavingAccess(true);
    try {
      const saved = await saveCourseAccessSettings(next);
      setCourseAccessSettings(saved);
      toast.show(message, 'success');
    } catch (error) {
      console.error('Failed to save course access', error);
      setCourseAccessSettings(previous);
      toast.show('บันทึกสถานะรายวิชาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setSavingAccess(false);
    }
  };

  const getSubjectsFromOpenCourses = (classroom: string, openCourseIds: string[]): Subject[] => {
    if (classroom.startsWith('\u0e1b.')) return ['main'];

    const level = classroom.replace('\u0e21.', '');
    const subjects: Subject[] = [];
    if (openCourseIds.includes(`m${level}-cs`)) subjects.push('cs');
    if (openCourseIds.includes(`m${level}-design`)) subjects.push('dt');
    return subjects.length > 0 ? subjects : ['cs'];
  };

  const handleToggleCourse = async (classroom: string, courseId: string) => {
    if (savingAccess) return;
    const availableCourseIds = getCourseIdsForClassroom(classroom);
    const currentOpenCourseIds = courseAccessSettings.openCourseIdsByClassroom[classroom] || [];
    const isOpen = currentOpenCourseIds.includes(courseId);
    const nextOpenCourseIds = (isOpen
      ? currentOpenCourseIds.filter((id) => id !== courseId)
      : Array.from(new Set([...currentOpenCourseIds, courseId])))
      .filter((id) => availableCourseIds.includes(id));

    if (nextOpenCourseIds.length === 0) {
      toast.show('ต้องเปิดอย่างน้อย 1 คอร์สในแต่ละชั้นเรียน', 'info');
      return;
    }

    await saveAccess(
      {
        ...courseAccessSettings,
        activeSubjectsByClassroom: {
          ...courseAccessSettings.activeSubjectsByClassroom,
          [classroom]: getSubjectsFromOpenCourses(classroom, nextOpenCourseIds),
        },
        openCourseIdsByClassroom: {
          ...courseAccessSettings.openCourseIdsByClassroom,
          [classroom]: nextOpenCourseIds,
        },
      },
      `อัปเดตคอร์สที่เปิดสำหรับ ${classroom} แล้ว`,
    );
  };

  const handleOpenAllCourses = async () => {
    if (savingAccess) return;

    const nextOpenCourseIdsByClassroom = { ...courseAccessSettings.openCourseIdsByClassroom };
    const nextActiveSubjectsByClassroom = { ...courseAccessSettings.activeSubjectsByClassroom };

    CLASSROOMS.forEach((classroom) => {
      const courseIds = getCourseIdsForClassroom(classroom);
      nextOpenCourseIdsByClassroom[classroom] = courseIds;
      nextActiveSubjectsByClassroom[classroom] = getSubjectsFromOpenCourses(classroom, courseIds);
    });

    await saveAccess(
      {
        ...courseAccessSettings,
        activeSubjectsByClassroom: nextActiveSubjectsByClassroom,
        openCourseIdsByClassroom: nextOpenCourseIdsByClassroom,
      },
      'เปิดทุกคอร์สทุกชั้นเรียนแล้ว',
    );
  };

  const handleCsOnly = async () => {
    await saveAccess(
      setMiddleSchoolCsOnly(courseAccessSettings),
      'ตั้งค่า ม.1-ม.3 ให้เปิดเฉพาะวิทยาการคำนวณแล้ว',
    );
  };

  return (
    <div className="lock-manager-container">
      <div className="lock-manager-alert">
        <div className="alert-icon-wrapper">
          <ShieldAlert size={20} />
        </div>
        <div className="alert-content">
          <h4>ระบบควบคุมบทเรียนที่นักเรียนเข้าได้</h4>
          <p>
            สถานะปลดล็อกจะถูกบันทึกลง Firebase แล้วใช้ร่วมกันทุกเครื่อง เมื่อคุณครูกดเปิดบทเรียน
            นักเรียนจะเห็นบทเรียนที่เปิดแล้วหลังโหลดหน้าใหม่หรือเข้าเว็บอีกครั้ง
          </p>
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: '1rem',
          marginBottom: '1rem',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>เปิด/ปิดคอร์สเรียนทุกชั้นตามเทอม</h3>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              คะแนนกิจกรรม เกม และแบบทดสอบจะลงเฉพาะคอร์สที่เปิดในชั้นเรียนนั้น เพื่อไม่ให้คะแนนไปผิดวิชา
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-bulk btn-bulk-unlock"
              disabled={savingAccess}
              onClick={handleOpenAllCourses}
            >
              เปิดทุกคอร์สทุกชั้น
            </button>
            <button
              type="button"
              className="btn-bulk btn-bulk-lock"
              disabled={savingAccess}
              onClick={handleCsOnly}
            >
              ม.ต้น: เปิดเฉพาะวิทยาการคำนวณ
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginTop: '1rem' }}>
          {CLASSROOMS.map((classroom) => {
            const availableCourseIds = getCourseIdsForClassroom(classroom);
            const openCourseIds = new Set(courseAccessSettings.openCourseIdsByClassroom[classroom] || []);
            return (
              <div
                key={classroom}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '0.85rem',
                  background: '#f8fafc',
                }}
              >
                <strong style={{ display: 'block', marginBottom: 8 }}>{classroom}</strong>
                <div style={{ display: 'grid', gap: 8 }}>
                  {availableCourseIds.map((courseId) => {
                    const course = courseById.get(courseId);
                    const isOpen = openCourseIds.has(courseId);
                    return (
                      <button
                        key={courseId}
                        type="button"
                        disabled={savingAccess}
                        onClick={() => handleToggleCourse(classroom, courseId)}
                        style={{
                          border: isOpen ? '1px solid #16a34a' : '1px solid #cbd5e1',
                          background: isOpen ? '#dcfce7' : '#ffffff',
                          color: isOpen ? '#166534' : '#475569',
                          borderRadius: 10,
                          padding: '0.5rem 0.65rem',
                          fontWeight: 800,
                          cursor: savingAccess ? 'wait' : 'pointer',
                          textAlign: 'left',
                          lineHeight: 1.35,
                        }}
                      >
                        {isOpen ? 'เปิด' : 'ปิด'} {course?.emoji || '📘'} {course?.title || courseId}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lock-manager-layout">
        <div className="lock-courses-sidebar">
          <div className="sidebar-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="ค้นหารายวิชา..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="sidebar-filter-tabs">
            <button
              className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              ทั้งหมด
            </button>
            <button
              className={`filter-tab ${activeFilter === 'primary' ? 'active' : ''}`}
              onClick={() => setActiveFilter('primary')}
            >
              ประถม
            </button>
            <button
              className={`filter-tab ${activeFilter === 'secondary' ? 'active' : ''}`}
              onClick={() => setActiveFilter('secondary')}
            >
              มัธยม
            </button>
            <button
              className={`filter-tab ${activeFilter === 'custom' ? 'active' : ''}`}
              onClick={() => setActiveFilter('custom')}
            >
              สร้างเอง
            </button>
          </div>

          <div className="courses-list-scroll">
            {filteredCourses.length === 0 ? (
              <div className="empty-courses-state">ไม่พบวิชาตามเงื่อนไขที่ระบุ</div>
            ) : (
              filteredCourses.map((course) => {
                const unlockedList = unlockedMap[course.id] || [];
                const totalUnits = course.units.length;
                const unlockedCount = totalUnits > 0
                  ? Array.from(new Set([...unlockedList, 1])).filter((no) =>
                      course.units.some((unit) => unit.no === no),
                    ).length
                  : 0;

                return (
                  <div
                    key={course.id}
                    className={`course-item-card ${effectiveSelectedCourseId === course.id ? 'active' : ''}`}
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    <span className="course-emoji">{course.emoji}</span>
                    <div className="course-card-info">
                      <h5>{course.title}</h5>
                      <div className="course-card-badges">
                        <span className={`badge-level ${getCourseCategory(course.id, course.isCustom)}`}>
                          {course.isCustom
                            ? 'คอร์สสร้างเอง'
                            : course.id.startsWith('p')
                              ? `ประถม (${course.id.toUpperCase()})`
                              : `มัธยม (${course.id.toUpperCase()})`}
                        </span>
                        <span className="badge-progress">
                          เปิดแล้ว {unlockedCount}/{totalUnits} บท
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lock-units-panel">
          {selectedCourse ? (
            <>
              <div className="panel-header">
                <div className="panel-course-info">
                  <span className="panel-emoji">{selectedCourse.emoji}</span>
                  <div>
                    <h3>{selectedCourse.title}</h3>
                    <p className="subtitle">
                      วิชา {selectedCourse.isCustom ? 'คอร์สที่สร้างเอง' : 'วิชาในระบบมาตรฐาน'} •
                      มีหน่วยเรียนทั้งหมด {selectedCourse.units.length} หน่วย
                    </p>
                  </div>
                </div>

                <div className="bulk-action-buttons">
                  <button
                    className="btn-bulk btn-bulk-unlock"
                    disabled={!!savingKey}
                    onClick={() => handleUnlockAll(selectedCourse)}
                  >
                    ปลดล็อกทุกบทเรียน
                  </button>
                  <button
                    className="btn-bulk btn-bulk-lock"
                    disabled={!!savingKey}
                    onClick={() => handleLockAll(selectedCourse)}
                  >
                    ล็อกทั้งหมด ยกเว้นหน่วยที่ 1
                  </button>
                </div>
              </div>

              <div className="units-list-wrapper">
                {selectedCourse.units.length === 0 ? (
                  <div className="empty-units-state">
                    <BookOpen size={48} className="icon-muted" />
                    <p>ยังไม่มีหน่วยเรียนในรายวิชานี้</p>
                  </div>
                ) : (
                  selectedCourse.units.map((unit) => {
                    const isUnlocked = unit.no === 1 || (unlockedMap[selectedCourse.id] || []).includes(unit.no);
                    const isSaving = savingKey === `${selectedCourse.id}_${unit.no}` || savingKey === `${selectedCourse.id}_all`;

                    return (
                      <div
                        key={unit.no}
                        className={`unit-lock-row ${isUnlocked ? 'unlocked' : 'locked'} ${unit.no === 1 ? 'always-unlocked' : ''}`}
                      >
                        <div className="unit-row-badge">หน่วยที่ {unit.no}</div>
                        <div className="unit-row-info">
                          <h4>{unit.title}</h4>
                          <span className={`status-pill ${isUnlocked ? 'status-unlocked' : 'status-locked'}`}>
                            {isSaving
                              ? 'กำลังบันทึก...'
                              : isUnlocked
                                ? 'เปิดให้นักเรียนเรียน'
                                : 'ปิดล็อกอยู่'}
                          </span>
                        </div>

                        <div className="unit-row-control">
                          {unit.no === 1 ? (
                            <span className="badge-always-open">
                              <Check size={14} /> เปิดใช้งานถาวร
                            </span>
                          ) : (
                            <div className="lock-toggle-wrapper">
                              <span className="toggle-label-hint">
                                {isUnlocked ? 'คลิกเพื่อล็อก' : 'คลิกเพื่อปลดล็อก'}
                              </span>
                              <button
                                type="button"
                                className={`lock-toggle-switch ${isUnlocked ? 'active' : ''}`}
                                disabled={!!savingKey}
                                aria-label={`${isUnlocked ? 'ล็อก' : 'ปลดล็อก'} หน่วยที่ ${unit.no}`}
                                onClick={() => handleToggleLock(selectedCourse.id, unit.no)}
                              >
                                <span className="switch-handle" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="empty-panel-state">
              <Layers size={64} className="icon-muted" />
              <h3>กรุณาเลือกรายวิชาด้านซ้ายเพื่อจัดการล็อกบทเรียน</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonLockManager;
