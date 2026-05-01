import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, BookOpen, Activity, ExternalLink } from 'lucide-react';
import { findGrade } from '../data/curriculum';
import './IndicatorDetail.css';

const IndicatorDetail: React.FC = () => {
  const { gradeId, idx } = useParams();
  const navigate = useNavigate();
  const grade = findGrade(gradeId || '');
  const indicatorIdx = parseInt(idx || '0', 10);
  const indicator = grade?.indicators[indicatorIdx];

  if (!grade || !indicator) {
    return (
      <div className="container section-padding">
        <h1>ไม่พบตัวชี้วัดนี้</h1>
        <Link to="/courses">← กลับสู่หน้าคอร์สเรียน</Link>
      </div>
    );
  }

  const mappedLessons = indicator.lessons
    .map((n) => ({ idx: n, lesson: grade.lessons[n - 1] }))
    .filter((x) => x.lesson);

  return (
    <div className="indicator-page container section-padding">
      <button className="btn-back" onClick={() => navigate('/courses')}>
        <ChevronLeft size={20} /> กลับไปที่คอร์สเรียน
      </button>

      <div className="ind-hero glass">
        <div className="ind-hero-emoji">{grade.emoji}</div>
        <div>
          <span className="badge">{grade.title}</span>
          <h1><Target size={28} /> {indicator.code}</h1>
          <p className="ind-statement">{indicator.text}</p>
        </div>
      </div>

      <div className="ind-grid">
        <section className="ind-section glass">
          <h2><Activity size={20} /> กิจกรรม / เนื้อหาที่สอน</h2>
          {indicator.activities && indicator.activities.length > 0 ? (
            <ul className="ind-activities">
              {indicator.activities.map((a, i) => (
                <li key={i}>
                  <span className="check">✓</span> {a}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">— ยังไม่ได้ระบุกิจกรรม —</p>
          )}
        </section>

        <section className="ind-section glass">
          <h2><BookOpen size={20} /> บทเรียนที่เกี่ยวข้อง</h2>
          {mappedLessons.length > 0 ? (
            <ol className="ind-lessons">
              {mappedLessons.map(({ idx: ln, lesson }) => (
                <li key={ln}>
                  {lesson.url ? (
                    <a href={lesson.url} target="_blank" rel="noreferrer">
                      {lesson.name} <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span>{lesson.name}</span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">— ตัวชี้วัดนี้เน้นกิจกรรมในชั้นเรียน ไม่ผูกบทเรียน Code.org โดยตรง —</p>
          )}
          <a className="btn-primary ind-cta" href={grade.courseUrl} target="_blank" rel="noreferrer">
            เปิดห้องเรียน {grade.title} <ExternalLink size={16} />
          </a>
        </section>
      </div>

      <nav className="ind-nav">
        {indicatorIdx > 0 && (
          <Link to={`/curriculum/${grade.id}/${indicatorIdx - 1}`} className="ind-nav-btn">
            ← ตัวชี้วัดก่อนหน้า
          </Link>
        )}
        {indicatorIdx < grade.indicators.length - 1 && (
          <Link to={`/curriculum/${grade.id}/${indicatorIdx + 1}`} className="ind-nav-btn next">
            ตัวชี้วัดถัดไป →
          </Link>
        )}
      </nav>
    </div>
  );
};

export default IndicatorDetail;
