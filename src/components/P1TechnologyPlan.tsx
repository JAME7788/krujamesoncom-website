import React, { useEffect, useMemo, useState } from 'react';
import {
  Award, BookOpen, Calendar, CheckCircle2, ClipboardCheck, Download, ExternalLink,
  FileText, Printer, RefreshCw, Save,
} from 'lucide-react';
import {
  p1AnnualUnits,
  p1Indicators,
  p1LessonPlans,
  getP1HourlySessions,
  p1References,
  p1ResearchProtocol,
  p1ScoringPlan,
  p1TechnologyCourse,
} from '../data/p1TechnologyPlan';
import type { KpaDomain, P1LessonPlan } from '../data/p1TechnologyPlan';
import {
  fetchLessonRecords,
  loadLessonRecords,
  makeLessonRecordId,
  saveLessonRecord,
} from '../services/lessonRecordService';
import type { LessonRecord, LessonRecordSnapshot } from '../services/lessonRecordService';
import {
  fetchClassroomFromFirebase,
  getIndicators,
  loadGrades,
} from '../services/gradeService';
import { fetchAllStudents, computeAttendance } from '../services/adminService';
import { fetchAttendance } from '../services/manualAttendanceService';
import { loadSchedule } from '../data/schedule';
import { useToast } from './Toast';
import './P1TechnologyPlan.css';

type View = 'annual' | 'lesson' | 'assessment';

const domainLabels: Record<KpaDomain, string> = {
  K: 'ความรู้ (K)',
  P: 'ทักษะกระบวนการ (P)',
  A: 'คุณลักษณะ (A)',
};

const buildPlanText = () => {
  const lines: string[] = [
    'แผนการจัดการเรียนรู้รายวิชาเทคโนโลยี (วิทยาการคำนวณ)',
    `${p1TechnologyCourse.grade} ปีการศึกษา ${p1TechnologyCourse.academicYear}`,
    `${p1TechnologyCourse.school} | ครูผู้สอน ${p1TechnologyCourse.teacher}`,
    `${p1TechnologyCourse.schedule} | ${p1TechnologyCourse.totalPeriods} คาบ คาบละ ${p1TechnologyCourse.periodMinutes} นาที`,
    '',
    'คำอธิบายรายวิชา',
    p1TechnologyCourse.description,
    '',
    'โครงสร้างรายปี',
  ];

  p1AnnualUnits.forEach((unit) => {
    lines.push(`หน่วยที่ ${unit.no} ${unit.title} (${unit.hours} คาบ) แผน ${unit.plans}`);
    lines.push(`ตัวชี้วัด: ${unit.indicators.join(', ')}`);
    lines.push(`คำถามสำคัญ: ${unit.essentialQuestion}`);
    lines.push(`หลักฐาน: ${unit.evidence}`, '');
  });

  lines.push('แผนการจัดการเรียนรู้รายชั่วโมง 40 แผน');
  p1LessonPlans.forEach((plan) => {
    lines.push('', `แผนที่ ${plan.no} ${plan.title}`);
    lines.push(`หน่วยที่ ${plan.unitNo} | สัปดาห์ ${plan.weeks} | ${plan.hours} คาบ | ${plan.indicators.join(', ')}`);
    lines.push(`คำถามสำคัญ: ${plan.essentialQuestion}`);
    lines.push(`สาระสำคัญ: ${plan.concept}`);
    lines.push('จุดประสงค์การเรียนรู้');
    plan.objectives.forEach((item) => lines.push(`- ${item.domain}: ${item.text}`));
    lines.push('สาระการเรียนรู้');
    plan.content.forEach((item) => lines.push(`- ${item}`));
    lines.push('ขั้นจัดกิจกรรมการเรียนรู้');
    plan.steps.forEach((step) => {
      lines.push(`${step.phase} (${step.minutes} นาที)`);
      lines.push(`ครู: ${step.teacher}`);
      lines.push(`นักเรียน: ${step.students}`);
      lines.push(`หลักฐาน: ${step.evidence}`);
    });
    lines.push(`ใบงาน: ${plan.worksheet}`);
    lines.push(`ชิ้นงาน: ${plan.product}`);
    lines.push('การวัดและประเมินผล');
    plan.assessments.forEach((item) => lines.push(`- ${item.domain}: ${item.method} | ${item.instrument} | ${item.criteria} | ${item.webRecord}`));
    lines.push('การช่วยเหลือและท้าทายผู้เรียน');
    plan.support.forEach((item) => lines.push(`- ${item}`));
  });

  lines.push('', 'โครงสร้างคะแนน', p1ScoringPlan.note, '', 'กระบวนการเก็บข้อมูลเชิงวิจัย');
  p1ResearchProtocol.forEach((item, index) => lines.push(`${index + 1}. ${item}`));
  return lines.join('\n');
};

const DomainBadge = ({ domain }: { domain: KpaDomain }) => (
  <span className={`p1plan-domain p1plan-domain-${domain.toLowerCase()}`}>{domain}</span>
);

const emptySnapshot: LessonRecordSnapshot = {
  present: 0,
  absent: 0,
  totalStudents: 0,
  passed: 0,
  averageK: 0,
  averageP: 0,
  attitudePassed: 0,
};

const emptyRecordForm = {
  strengths: '',
  problems: '',
  causes: '',
  improvements: '',
  nextAction: '',
  status: 'complete' as LessonRecord['status'],
};

const PostTeachingRecord = ({ plan }: { plan: P1LessonPlan }) => {
  const sessions = useMemo(() => getP1HourlySessions(plan), [plan]);
  const hourNo = 1;
  const [teachingDate, setTeachingDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<LessonRecord[]>(loadLessonRecords);
  const [snapshot, setSnapshot] = useState<LessonRecordSnapshot>(emptySnapshot);
  const [form, setForm] = useState(emptyRecordForm);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const recordId = makeLessonRecordId(plan.no, hourNo, teachingDate);

  useEffect(() => {
    let cancelled = false;
    fetchLessonRecords()
      .then((items) => {
        if (cancelled) return;
        setRecords(items);
        const existing = items.find((item) => item.id === recordId);
        setSnapshot(existing?.snapshot || emptySnapshot);
        setForm(existing ? {
          strengths: existing.strengths,
          problems: existing.problems,
          causes: existing.causes,
          improvements: existing.improvements,
          nextAction: existing.nextAction,
          status: existing.status,
        } : emptyRecordForm);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  // อ่าน Firebase ครั้งเดียวเมื่อเปิดแบบบันทึกของแผนนี้
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectRecord = (nextHourNo: number, nextDate: string) => {
    const existing = records.find((item) => (
      item.id === makeLessonRecordId(plan.no, nextHourNo, nextDate)
    ));
    setSnapshot(existing?.snapshot || emptySnapshot);
    setForm(existing ? {
      strengths: existing.strengths,
      problems: existing.problems,
      causes: existing.causes,
      improvements: existing.improvements,
      nextAction: existing.nextAction,
      status: existing.status,
    } : emptyRecordForm);
  };

  const refreshSnapshot = async () => {
    setBusy(true);
    try {
      const [remoteGrades, students, manualAttendance] = await Promise.all([
        fetchClassroomFromFirebase('ป.1', 'main'),
        fetchAllStudents(),
        fetchAttendance(teachingDate, 'ป.1'),
      ]);
      const grades = remoteGrades?.length ? remoteGrades : loadGrades('ป.1', 'main');
      const [year, month, day] = teachingDate.split('-').map(Number);
      const automaticAttendance = computeAttendance(
        students,
        'ป.1',
        loadSchedule(),
        new Date(year, month - 1, day, 12).getTime(),
      );
      const presentNumbers = new Set(
        automaticAttendance
          .filter((item) => item.status === 'present')
          .map((item) => Number(item.studentNumber)),
      );
      grades.forEach((student) => {
        if (manualAttendance.records[student.studentCode] === 'present') {
          presentNumbers.add(student.studentNo);
        }
      });

      const indicatorIds = new Set(
        getIndicators('ป.1', 'main')
          .filter((indicator) => plan.indicators.includes(indicator.code))
          .map((indicator) => indicator.id),
      );
      const linkedScores = grades.flatMap((student) => (
        Object.entries(student.indicators)
          .filter(([indicatorId]) => indicatorIds.has(indicatorId))
          .map(([, score]) => score)
      ));
      const passed = grades.filter((student) => {
        const scores = Object.entries(student.indicators)
          .filter(([indicatorId]) => indicatorIds.has(indicatorId))
          .map(([, score]) => score);
        return scores.length > 0 && scores.every((score) => (
          score.k >= 9 && (score.pScore || 0) >= 15 && score.a
        ));
      }).length;
      const nextSnapshot: LessonRecordSnapshot = {
        present: presentNumbers.size,
        absent: Math.max(0, grades.length - presentNumbers.size),
        totalStudents: grades.length,
        passed,
        averageK: linkedScores.length
          ? Math.round((linkedScores.reduce((sum, score) => sum + score.k, 0) / linkedScores.length) * 10) / 10
          : 0,
        averageP: linkedScores.length
          ? Math.round((linkedScores.reduce((sum, score) => sum + (score.pScore || 0), 0) / linkedScores.length) * 10) / 10
          : 0,
        attitudePassed: grades.filter((student) => {
          const scores = Object.entries(student.indicators)
            .filter(([indicatorId]) => indicatorIds.has(indicatorId))
            .map(([, score]) => score);
          return scores.length > 0 && scores.every((score) => score.a);
        }).length,
      };
      setSnapshot(nextSnapshot);
      toast.show('ดึงเช็คชื่อและ K/P/A ล่าสุดมาใส่บันทึกแล้ว', 'success');
    } catch (error) {
      toast.show(`ดึงข้อมูลสรุปไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const saved = await saveLessonRecord({
        classroom: 'ป.1',
        subject: 'main',
        planNo: plan.no,
        hourNo,
        teachingDate,
        indicatorCodes: plan.indicators,
        snapshot,
        ...form,
      });
      setRecords((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
      toast.show(`บันทึกหลังสอนแผนที่ ${plan.no} ลง Firebase แล้ว`, 'success');
    } catch (error) {
      toast.show(`บันทึกไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="p1plan-post-record">
      <div className="p1plan-post-record-heading">
        <div>
          <span>บันทึกจริงหลังจบคาบ</span>
          <h4><ClipboardCheck size={20} /> บันทึกหลังสอนลง Firebase</h4>
          <p>{sessions[hourNo - 1]?.title} • {plan.indicators.join(', ')}</p>
        </div>
        <div className="p1plan-post-record-controls">
          <div className="p1plan-post-record-plan">
            <span>แผนรายชั่วโมง</span>
            <strong>แผนที่ {plan.no} · {sessions[0]?.minutes || p1TechnologyCourse.periodMinutes} นาที</strong>
          </div>
          <label>วันที่สอน
            <input type="date" value={teachingDate} onChange={(event) => {
              const nextDate = event.target.value;
              setTeachingDate(nextDate);
              selectRecord(hourNo, nextDate);
            }} />
          </label>
        </div>
      </div>

      <div className="p1plan-post-kpis">
        <div><span>มาเรียน</span><strong>{snapshot.present}/{snapshot.totalStudents}</strong></div>
        <div><span>ผ่านจุดประสงค์</span><strong>{snapshot.passed}</strong></div>
        <div><span>K เฉลี่ย</span><strong>{snapshot.averageK}/15</strong></div>
        <div><span>P เฉลี่ย</span><strong>{snapshot.averageP}/30</strong></div>
        <div><span>A ผ่าน</span><strong>{snapshot.attitudePassed}</strong></div>
      </div>

      <button type="button" className="p1plan-refresh-record" onClick={() => void refreshSnapshot()} disabled={busy}>
        <RefreshCw size={16} /> ดึงเช็คชื่อและ K/P/A ล่าสุด
      </button>

      <div className="p1plan-post-fields">
        <label>สิ่งที่ผู้เรียนทำได้ดี<textarea rows={3} value={form.strengths} onChange={(event) => setForm({ ...form, strengths: event.target.value })} /></label>
        <label>ปัญหาที่พบ<textarea rows={3} value={form.problems} onChange={(event) => setForm({ ...form, problems: event.target.value })} /></label>
        <label>สาเหตุ<textarea rows={3} value={form.causes} onChange={(event) => setForm({ ...form, causes: event.target.value })} /></label>
        <label>แนวทางปรับปรุง<textarea rows={3} value={form.improvements} onChange={(event) => setForm({ ...form, improvements: event.target.value })} /></label>
        <label className="wide">สิ่งที่จะทำในคาบถัดไป<textarea rows={2} value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} /></label>
      </div>

      <div className="p1plan-post-footer">
        <label>สถานะ
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as LessonRecord['status'] })}>
            <option value="complete">บันทึกสมบูรณ์</option>
            <option value="draft">ฉบับร่าง</option>
          </select>
        </label>
        <button type="button" onClick={() => void save()} disabled={busy || !teachingDate}>
          <Save size={17} /> {busy ? 'กำลังบันทึก...' : 'บันทึกหลังสอน'}
        </button>
      </div>
    </section>
  );
};

const PlanDetail = ({ plan, allowRecord = false }: { plan: P1LessonPlan; allowRecord?: boolean }) => (
  <article className="p1plan-detail">
    <header className="p1plan-detail-header">
      <div>
        <span className="p1plan-eyebrow">แผนที่ {plan.no} · หน่วยที่ {plan.unitNo} · สัปดาห์ {plan.weeks}</span>
        <h3>{plan.title}</h3>
        <p>{plan.concept}</p>
      </div>
      <div className="p1plan-hours"><strong>{plan.hours}</strong><span>คาบ</span></div>
    </header>

    <div className="p1plan-indicator-row">
      {plan.indicators.map((code) => <span key={code}>{code}</span>)}
      <p><strong>คำถามสำคัญ:</strong> {plan.essentialQuestion}</p>
    </div>

    <section className="p1plan-section">
      <h4>จุดประสงค์การเรียนรู้</h4>
      <div className="p1plan-objectives">
        {plan.objectives.map((item) => (
          <div key={item.domain}>
            <DomainBadge domain={item.domain} />
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="p1plan-section p1plan-two-col">
      <div>
        <h4>สาระการเรียนรู้</h4>
        <ul>{plan.content.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div>
        <h4>คำศัพท์สำคัญ</h4>
        <div className="p1plan-tags">{plan.vocabulary.map((word) => <span key={word}>{word}</span>)}</div>
        <h4 className="p1plan-subheading">คำถามตรวจสอบ</h4>
        <ol>{plan.checkQuestions.map((item) => <li key={item}>{item}</li>)}</ol>
      </div>
    </section>

    <section className="p1plan-section">
      <h4>กระบวนการเรียนรู้ 5 ขั้น รวม {plan.steps.reduce((sum, step) => sum + step.minutes, 0)} นาที</h4>
      <div className="p1plan-timeline">
        {plan.steps.map((step) => (
          <div className="p1plan-step" key={step.phase}>
            <div className="p1plan-step-time">{step.minutes}<span>นาที</span></div>
            <div>
              <h5>{step.phase}</h5>
              <p><strong>ครู:</strong> {step.teacher}</p>
              <p><strong>นักเรียน:</strong> {step.students}</p>
              <p className="p1plan-evidence"><strong>หลักฐาน:</strong> {step.evidence}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="p1plan-section p1plan-two-col">
      <div>
        <h4>สื่อและแหล่งเรียนรู้</h4>
        <div className="p1plan-links">
          {plan.media.map((item) => item.href ? (
            <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" key={item.label}>
              <BookOpen size={16} /> {item.label} <ExternalLink size={14} />
            </a>
          ) : <span key={item.label}><BookOpen size={16} /> {item.label}</span>)}
        </div>
      </div>
      <div>
        <h4>ใบงานและชิ้นงาน</h4>
        <p><strong>ใบงาน:</strong> {plan.worksheet}</p>
        <p><strong>ชิ้นงาน:</strong> {plan.product}</p>
      </div>
    </section>

    <section className="p1plan-section">
      <h4>การวัดและประเมินผล K/P/A</h4>
      <div className="p1plan-assessments">
        {plan.assessments.map((item) => (
          <div key={item.domain}>
            <div className="p1plan-assessment-title"><DomainBadge domain={item.domain} /><strong>{domainLabels[item.domain]}</strong></div>
            <p>{item.method}</p>
            <dl>
              <dt>เครื่องมือ</dt><dd>{item.instrument}</dd>
              <dt>เกณฑ์ผ่าน</dt><dd>{item.criteria}</dd>
              <dt>ลงในเว็บ</dt><dd>{item.webRecord}</dd>
            </dl>
          </div>
        ))}
      </div>
    </section>

    <section className="p1plan-section p1plan-two-col">
      <div>
        <h4>การช่วยเหลือและเพิ่มความท้าทาย</h4>
        <ul>{plan.support.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div>
        <h4>หลักฐานสำหรับวิเคราะห์ผล</h4>
        <ul>{plan.researchEvidence.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </section>

    <section className="p1plan-reflection">
      <h4>บันทึกหลังสอน</h4>
      <div><span>นักเรียนผ่านจุดประสงค์</span><span>_____ คน</span><span>คิดเป็นร้อยละ _____</span></div>
      <p><strong>สิ่งที่ทำได้ดี:</strong> ........................................................................................................................................</p>
      <p><strong>ปัญหา/สาเหตุ:</strong> ..........................................................................................................................................</p>
      <p><strong>การปรับครั้งถัดไป:</strong> .....................................................................................................................................</p>
    </section>
    {allowRecord && <PostTeachingRecord plan={plan} key={plan.no} />}
  </article>
);

const P1TechnologyPlan: React.FC = () => {
  const [view, setView] = useState<View>('annual');
  const [selectedPlan, setSelectedPlan] = useState(1);
  const plan = useMemo(
    () => p1LessonPlans.find((item) => item.no === selectedPlan) || p1LessonPlans[0],
    [selectedPlan],
  );

  const downloadText = () => {
    const blob = new Blob(['\ufeff' + buildPlanText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'แผนเทคโนโลยี_ป1_ปี2569.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p1plan-shell">
      <header className="p1plan-hero">
        <div>
          <span className="p1plan-eyebrow">แผนฉบับพร้อมสอน · ปีการศึกษา {p1TechnologyCourse.academicYear}</span>
          <h2>{p1TechnologyCourse.courseName} {p1TechnologyCourse.grade}</h2>
          <p>{p1TechnologyCourse.school} · ครูผู้สอน {p1TechnologyCourse.teacher}</p>
        </div>
        <div className="p1plan-actions">
          <button type="button" onClick={() => window.print()} title="พิมพ์แผนฉบับเต็ม">
            <Printer size={17} /> พิมพ์ฉบับเต็ม
          </button>
          <button type="button" onClick={downloadText} title="ดาวน์โหลดแผนเป็นข้อความ">
            <Download size={17} /> ดาวน์โหลด
          </button>
        </div>
      </header>

      <div className="p1plan-metrics" aria-label="ข้อมูลสรุปแผน">
        <div><Calendar size={20} /><strong>{p1TechnologyCourse.totalPeriods}</strong><span>คาบตลอดปี</span></div>
        <div><FileText size={20} /><strong>{p1LessonPlans.length}</strong><span>แผนพร้อมสอน</span></div>
        <div><CheckCircle2 size={20} /><strong>{p1Indicators.length}</strong><span>ตัวชี้วัดครบ</span></div>
        <div><Award size={20} /><strong>100</strong><span>คะแนน K/P/A + สอบ</span></div>
      </div>

      <nav className="p1plan-tabs" aria-label="มุมมองแผนการสอน">
        <button type="button" className={view === 'annual' ? 'active' : ''} onClick={() => setView('annual')}><Calendar size={17} /> โครงสร้างรายปี</button>
        <button type="button" className={view === 'lesson' ? 'active' : ''} onClick={() => setView('lesson')}><BookOpen size={17} /> แผนรายคาบ</button>
        <button type="button" className={view === 'assessment' ? 'active' : ''} onClick={() => setView('assessment')}><Award size={17} /> การวัดผลและวิจัย</button>
      </nav>

      {view === 'annual' && (
        <div className="p1plan-view">
          <section className="p1plan-course-summary">
            <div>
              <h3>ข้อมูลรายวิชา</h3>
              <p><strong>เวลาเรียน:</strong> {p1TechnologyCourse.schedule} จำนวน {p1TechnologyCourse.totalPeriods} คาบ คาบละ {p1TechnologyCourse.periodMinutes} นาที</p>
              <p><strong>รูปแบบ:</strong> {p1TechnologyCourse.model}</p>
              <p>{p1TechnologyCourse.description}</p>
            </div>
            <div>
              <h3>สมรรถนะที่พัฒนา</h3>
              <ul>{p1TechnologyCourse.competencies.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </section>

          <section className="p1plan-section">
            <h3>ตัวชี้วัด ว 4.2 ชั้นประถมศึกษาปีที่ 1</h3>
            <div className="p1plan-indicators">
              {p1Indicators.map((indicator) => (
                <div key={indicator.code}><strong>{indicator.code}</strong><p>{indicator.text}</p></div>
              ))}
            </div>
          </section>

          <section className="p1plan-section">
            <h3>โครงสร้าง 4 หน่วย 40 แผนรายชั่วโมง</h3>
            <div className="p1plan-table-wrap">
              <table>
                <thead><tr><th>หน่วย</th><th>ชื่อหน่วยและคำถามสำคัญ</th><th>ตัวชี้วัด</th><th>หลักฐานสำคัญ</th><th>เวลา</th></tr></thead>
                <tbody>
                  {p1AnnualUnits.map((unit) => (
                    <tr key={unit.no}>
                      <td><strong>{unit.no}</strong><span>แผน {unit.plans}</span></td>
                      <td><strong>{unit.title}</strong><p>{unit.essentialQuestion}</p></td>
                      <td>{unit.indicators.join(', ')}</td>
                      <td>{unit.evidence}</td>
                      <td><strong>{unit.hours} คาบ</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {view === 'lesson' && (
        <div className="p1plan-view">
          <div className="p1plan-picker" aria-label="เลือกแผนการสอน">
            {p1LessonPlans.map((item) => (
              <button type="button" key={item.no} className={selectedPlan === item.no ? 'active' : ''} onClick={() => setSelectedPlan(item.no)}>
                <span>{item.no}</span><strong>{item.title}</strong><small>{item.indicators.join(' · ')}</small>
              </button>
            ))}
          </div>
          <PlanDetail plan={plan} allowRecord key={plan.no} />
        </div>
      )}

      {view === 'assessment' && (
        <div className="p1plan-view">
          <section className="p1plan-scoring">
            <div>
              <span>คะแนนเก็บ</span><strong>{p1ScoringPlan.collected}</strong><small>K/P/A จาก 5 ตัวชี้วัด</small>
            </div>
            <div>
              <span>กลางภาค</span><strong>{p1ScoringPlan.midterm}</strong><small>ความรู้และสถานการณ์</small>
            </div>
            <div>
              <span>ปลายภาค</span><strong>{p1ScoringPlan.final}</strong><small>ความรู้และการประยุกต์</small>
            </div>
            <div>
              <span>รวมทั้งปี</span><strong>100</strong><small>ออก 1 ปี 1 เกรด</small>
            </div>
          </section>

          <section className="p1plan-section">
            <h3>วิธีลงคะแนนในระบบ</h3>
            <p>{p1ScoringPlan.note}</p>
            <div className="p1plan-kpa-grid">
              <div><DomainBadge domain="K" /><strong>{p1ScoringPlan.indicatorK} คะแนน/ตัวชี้วัด</strong><p>นำคะแนนแบบทดสอบหรือภารกิจความรู้ 0-15 กรอกในช่อง K ระบบจะแปลงตามสัดส่วน</p></div>
              <div><DomainBadge domain="P" /><strong>{p1ScoringPlan.indicatorP} คะแนน/ตัวชี้วัด</strong><p>เลือก ดี ปานกลาง หรือพอใช้ จากรูบริกชิ้นงานและการปฏิบัติจริง</p></div>
              <div><DomainBadge domain="A" /><strong>{p1ScoringPlan.indicatorA} คะแนน/ตัวชี้วัด</strong><p>ทำเครื่องหมายผ่านเมื่อมีหลักฐานพฤติกรรมตามเกณฑ์ ไม่ใช้ความรู้สึกเพียงครั้งเดียว</p></div>
            </div>
          </section>

          <section className="p1plan-section p1plan-two-col">
            <div>
              <h3>กระบวนการเก็บข้อมูลแบบวิจัย</h3>
              <ol>{p1ResearchProtocol.map((item) => <li key={item}>{item}</li>)}</ol>
            </div>
            <div>
              <h3>แหล่งอ้างอิงทางการ</h3>
              <div className="p1plan-links">
                {p1References.map((item) => (
                  <a href={item.href} target="_blank" rel="noreferrer" key={item.href}><BookOpen size={16} /> {item.label} <ExternalLink size={14} /></a>
                ))}
              </div>
              <p className="p1plan-copyright">แผนและถ้อยคำอธิบายในหน้านี้เรียบเรียงใหม่สำหรับการสอนของโรงเรียน ลิงก์ภายนอกใช้เป็นแหล่งอ้างอิง ไม่ได้นำไฟล์หรือสไลด์ของบุคคลอื่นมาเผยแพร่ซ้ำในเว็บ</p>
            </div>
          </section>
        </div>
      )}

      <div className="p1plan-print-document" aria-hidden="true">
        <div className="p1plan-print-cover">
          <p>แผนการจัดการเรียนรู้ฉบับพร้อมสอน</p>
          <h1>{p1TechnologyCourse.courseName}</h1>
          <h2>{p1TechnologyCourse.grade}</h2>
          <p>ปีการศึกษา {p1TechnologyCourse.academicYear}</p>
          <p>{p1TechnologyCourse.school}</p>
          <p>ครูผู้สอน {p1TechnologyCourse.teacher}</p>
        </div>
        <section>
          <h2>คำอธิบายรายวิชา</h2>
          <p>{p1TechnologyCourse.description}</p>
          <p><strong>เวลาเรียน:</strong> {p1TechnologyCourse.schedule} รวม {p1TechnologyCourse.totalPeriods} คาบ</p>
          <h2>ตัวชี้วัด</h2>
          <ol>{p1Indicators.map((item) => <li key={item.code}><strong>{item.code}</strong> {item.text}</li>)}</ol>
          <h2>โครงสร้างรายปี</h2>
          {p1AnnualUnits.map((unit) => <p key={unit.no}><strong>หน่วยที่ {unit.no} {unit.title}</strong> {unit.hours} คาบ · {unit.indicators.join(', ')}<br />{unit.evidence}</p>)}
        </section>
        {p1LessonPlans.map((item) => <PlanDetail plan={item} key={item.no} />)}
        <section>
          <h2>โครงสร้างคะแนนและการเก็บข้อมูล</h2>
          <p>{p1ScoringPlan.note}</p>
          <ol>{p1ResearchProtocol.map((item) => <li key={item}>{item}</li>)}</ol>
        </section>
      </div>
    </div>
  );
};

export default P1TechnologyPlan;
