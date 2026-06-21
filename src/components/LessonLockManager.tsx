import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Layers, Check, ShieldAlert } from 'lucide-react';
import { grades } from '../data/curriculum';
import { loadCourses } from '../services/contentService';
import { getUnlockedUnits, toggleUnitLock, saveUnlockedUnits } from '../services/unitLockService';
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
  
  // โหลดคอร์สทั้งหมด (Built-in + Custom)
  const allCourses = useMemo(() => {
    const customCourses = loadCourses();
    const list: UnifiedCourse[] = [
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
    return list;
  }, []);

  // เลือกคอร์สแรกเป็นดีฟอลต์
  const [selectedCourseId, setSelectedCourseId] = useState<string>(allCourses[0]?.id || '');
  
  // โหลดข้อมูลสถานะปลดล็อกรายหน่วย
  const [unlockedMap, setUnlockedMap] = useState<Record<string, number[]>>(() => getUnlockedUnits());

  const selectedCourse = useMemo(() => {
    return allCourses.find((c) => c.id === selectedCourseId);
  }, [allCourses, selectedCourseId]);

  // ฟังก์ชันหาหมวดหมู่ของคอร์ส
  const getCourseCategory = (id: string, isCustom: boolean) => {
    if (isCustom) return 'custom';
    if (id.startsWith('p')) return 'primary';
    if (id.startsWith('m')) return 'secondary';
    return 'primary'; // fallback
  };

  // กรองคอร์ส
  const filteredCourses = useMemo(() => {
    return allCourses.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
      const cat = getCourseCategory(c.id, c.isCustom);
      const matchFilter = activeFilter === 'all' || cat === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [allCourses, searchTerm, activeFilter]);

  const [prevFilteredCourses, setPrevFilteredCourses] = useState(filteredCourses);
  if (filteredCourses !== prevFilteredCourses) {
    setPrevFilteredCourses(filteredCourses);
    if (filteredCourses.length > 0) {
      const found = filteredCourses.find((c) => c.id === selectedCourseId);
      if (!found) {
        setSelectedCourseId(filteredCourses[0].id);
      }
    }
  }


  // จัดการปลดล็อก/ล็อกรายหน่วย
  const handleToggleLock = (courseId: string, unitNo: number) => {
    if (unitNo === 1) {
      toast.show('หน่วยที่ 1 ถูกกำหนดให้เปิดเรียนตลอดเวลาเพื่อความสะดวกของนักเรียนค่ะ', 'info');
      return;
    }
    
    const currentlyUnlocked = (unlockedMap[courseId] || []).includes(unitNo);
    const newUnlockState = !currentlyUnlocked;
    
    toggleUnitLock(courseId, unitNo, newUnlockState);
    
    // อัปเดต state
    setUnlockedMap(getUnlockedUnits());
    
    if (newUnlockState) {
      toast.show(`🔓 ปลดล็อกหน่วยที่ ${unitNo} ของวิชา "${selectedCourse?.title}" สำเร็จ`, 'success');
    } else {
      toast.show(`🔒 ล็อกหน่วยที่ ${unitNo} ของวิชา "${selectedCourse?.title}" สำเร็จ`, 'info');
    }
  };

  // ปลดล็อกทั้งหมดในรายวิชานั้นๆ
  const handleUnlockAll = (course: UnifiedCourse) => {
    const unitNos = course.units.map((u) => u.no);
    const currentUnlocked = unlockedMap[course.id] || [];
    
    // รวมหน่วยที่ 1 และหน่วยอื่นๆ ทั้งหมดเข้าไป
    const newUnlocked = Array.from(new Set([...currentUnlocked, ...unitNos]));
    
    const updatedMap = { ...unlockedMap, [course.id]: newUnlocked };
    saveUnlockedUnits(updatedMap);
    setUnlockedMap(updatedMap);
    
    toast.show(`🔓 ปลดล็อกทุกหน่วยเรียนในวิชา "${course.title}" แล้ว`, 'success');
  };

  // ล็อกทั้งหมดในรายวิชานั้นๆ (ยกเว้นหน่วยที่ 1)
  const handleLockAll = (course: UnifiedCourse) => {
    const updatedMap = { ...unlockedMap, [course.id]: [1] }; // เหลือแค่หน่วยที่ 1 เท่านั้นที่เปิด
    saveUnlockedUnits(updatedMap);
    setUnlockedMap(updatedMap);
    
    toast.show(`🔒 ล็อกทุกหน่วยเรียนของวิชา "${course.title}" (ยกเว้นหน่วยที่ 1) สำเร็จ`, 'info');
  };

  return (
    <div className="lock-manager-container">
      {/* ส่วนหัวให้คำแนะนำ */}
      <div className="lock-manager-alert">
        <div className="alert-icon-wrapper">
          <ShieldAlert size={20} />
        </div>
        <div className="alert-content">
          <h4>💡 ระบบป้องกันนักเรียนเรียนข้ามบท (Scope Controller)</h4>
          <p>
            คุณครูสามารถควบคุมไม่ให้นักเรียนเปิดดูบทเรียนล่วงหน้าได้ โดยระบบจะล็อกเนื้อหาหน่วยที่ 2 ขึ้นไปไว้เป็นค่าเริ่มต้น (หน่วยที่ 1 จะเปิดตลอดเวลา) 
            คุณครูสามารถกด **"ปลดล็อก 🔓"** ทีละบทเรียนเมื่อถึงคาบเรียน เพื่อให้นักเรียนโฟกัสและก้าวไปพร้อมๆ กันในห้องเรียนค่ะ
          </p>
        </div>
      </div>

      <div className="lock-manager-layout">
        {/* คอลัมน์ซ้าย: รายการวิชา */}
        <div className="lock-courses-sidebar">
          <div className="sidebar-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="ค้นหารายวิชา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              filteredCourses.map((c) => {
                const unlockedList = unlockedMap[c.id] || [];
                const totalUnits = c.units.length;
                // หน่วยที่ 1 เปิดตลอดเวลาอยู่แล้ว ดังนั้นจำนวนที่เปิด = จำนวนที่ครูเปิด + หน่วยที่ 1 (ถ้าไม่มีในลิสต์)
                const unlockedCount = totalUnits > 0
                  ? Array.from(new Set([...unlockedList, 1])).filter(no => c.units.some(u => u.no === no)).length
                  : 0;

                return (
                  <div
                    key={c.id}
                    className={`course-item-card ${selectedCourseId === c.id ? 'active' : ''}`}
                    onClick={() => setSelectedCourseId(c.id)}
                  >
                    <span className="course-emoji">{c.emoji}</span>
                    <div className="course-card-info">
                      <h5>{c.title}</h5>
                      <div className="course-card-badges">
                        <span className={`badge-level ${getCourseCategory(c.id, c.isCustom)}`}>
                          {c.isCustom ? 'คอร์สสร้างเอง' : c.id.startsWith('p') ? `ประถม (${c.id.toUpperCase()})` : `มัธยม (${c.id.toUpperCase()})`}
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

        {/* คอลัมน์ขวา: การปลดล็อกบทเรียนในวิชาที่เลือก */}
        <div className="lock-units-panel">
          {selectedCourse ? (
            <>
              <div className="panel-header">
                <div className="panel-course-info">
                  <span className="panel-emoji">{selectedCourse.emoji}</span>
                  <div>
                    <h3>{selectedCourse.title}</h3>
                    <p className="subtitle">
                      วิชา {selectedCourse.isCustom ? 'คอร์สที่สร้างเอง' : 'วิชาในระบบมาตรฐาน'} • มีหน่วยเรียนทั้งหมด {selectedCourse.units.length} หน่วย
                    </p>
                  </div>
                </div>

                <div className="bulk-action-buttons">
                  <button
                    className="btn-bulk btn-bulk-unlock"
                    onClick={() => handleUnlockAll(selectedCourse)}
                  >
                    🔓 ปลดล็อกทุกบทเรียน
                  </button>
                  <button
                    className="btn-bulk btn-bulk-lock"
                    onClick={() => handleLockAll(selectedCourse)}
                  >
                    🔒 ล็อกทั้งหมด (ยกเว้นหน่วยที่ 1)
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
                    
                    return (
                      <div
                        key={unit.no}
                        className={`unit-lock-row ${isUnlocked ? 'unlocked' : 'locked'} ${unit.no === 1 ? 'always-unlocked' : ''}`}
                      >
                        <div className="unit-row-badge">หน่วยที่ {unit.no}</div>
                        <div className="unit-row-info">
                          <h4>{unit.title}</h4>
                          <span className={`status-pill ${isUnlocked ? 'status-unlocked' : 'status-locked'}`}>
                            {isUnlocked ? '🔓 เปิดให้นักเรียนเรียน' : '🔒 ปิดล็อกอยู่'}
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
                              <div
                                className={`lock-toggle-switch ${isUnlocked ? 'active' : ''}`}
                                onClick={() => handleToggleLock(selectedCourse.id, unit.no)}
                              >
                                <div className="switch-handle" />
                              </div>
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
