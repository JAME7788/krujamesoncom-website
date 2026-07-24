import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileQuestion,
  Printer,
  Save,
  Users,
} from 'lucide-react';
import type { StudentInfo } from '../data/students2569';
import {
  characteristicCriteria,
  getPrimaryTechnologyPlan,
  primaryTechnologyCompetencyPlans,
  rubricLevels,
  technologyCompetencyCriteria,
} from '../data/primaryTechnologyCompetencyPlans';
import type { PrimaryGrade, PrimaryTechnologyCompetencyPlan } from '../data/primaryTechnologyCompetencyPlans';
import { ACADEMIC_YEAR, COURSE_TEACHER_NAME } from '../services/gradeService';
import {
  calculateAssessmentResult,
  loadPrimaryCompetencyAssessment,
  savePrimaryCompetencyAssessment,
} from '../services/primaryCompetencyAssessmentService';
import { fetchRostersFromFirebase, loadRoster } from '../services/rosterService';
import { useToast } from './Toast';
import './PrimaryTechnologyPlans.css';

type View = 'plan' | 'quiz' | 'assessment' | 'criteria';

const emptyScores = () => [0, 0, 0, 0, 0];

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const listHtml = (items: string[]) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;

const buildPlanDocumentHtml = (plan: PrimaryTechnologyCompetencyPlan) => `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><title>แผนการจัดการเรียนรู้ ${escapeHtml(plan.grade)}</title>
<style>
@page { size: A4; margin: 1.5cm; }
body { font-family: "TH Sarabun New", "Sarabun", Arial, sans-serif; color: #111; font-size: 16pt; line-height: 1.35; }
h1,h2,h3,p { margin: 0; } h1 { font-size: 20pt; text-align: center; } h2 { margin-top: 3pt; font-size: 18pt; text-align: center; }
.meta,.grid { width: 100%; border-collapse: collapse; margin: 12pt 0; } .meta td,.grid th,.grid td { border: 1px solid #444; padding: 6pt 7pt; vertical-align: top; }
.grid th { background: #e8eef5; text-align: center; } .section { margin-top: 12pt; font-weight: bold; font-size: 17pt; }
.outcome { border-left: 5px solid #1f4e79; background: #eef4f8; padding: 8pt 10pt; margin-top: 6pt; }
ul { margin: 4pt 0 0 22pt; padding: 0; } li { margin-bottom: 3pt; } .signature { margin-top: 22pt; text-align: center; }
</style></head><body>
<h1>แผนการจัดการเรียนรู้แบบฐานสมรรถนะ</h1><h2>กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี</h2>
<table class="meta"><tr><td><b>รายวิชา</b> เทคโนโลยี</td><td><b>ชั้น</b> ${escapeHtml(plan.grade)}</td></tr><tr><td><b>เรื่อง</b> ${escapeHtml(plan.title)}</td><td><b>เวลา</b> 4 คาบ (200 นาที)</td></tr><tr><td><b>ปีการศึกษา</b> ${ACADEMIC_YEAR}</td><td><b>ครูผู้สอน</b> ${escapeHtml(COURSE_TEACHER_NAME)}</td></tr></table>
<p class="section">1. ผลลัพธ์การเรียนรู้หลัก</p><div class="outcome"><b>ข้อ 5</b> ${escapeHtml(plan.mainOutcome)}</div>
<p class="section">2. ตัวชี้วัดที่ใช้เป็นหลักฐาน</p>${listHtml(plan.subIndicators.map((item) => `${item.code} ${item.description}`))}
<p class="section">3. จุดประสงค์การเรียนรู้</p><table class="grid"><tr><th style="width:12%">ด้าน</th><th>จุดประสงค์</th></tr><tr><td><b>K</b></td><td>${escapeHtml(plan.objectives.k)}</td></tr><tr><td><b>P</b></td><td>${escapeHtml(plan.objectives.p)}</td></tr><tr><td><b>A</b></td><td>${escapeHtml(plan.objectives.a)}</td></tr></table>
<p class="section">4. สาระสำคัญ</p><p>${escapeHtml(plan.concept)}</p>
<p class="section">5. สาระการเรียนรู้</p>${listHtml(plan.content)}
<p class="section">6. สมรรถนะสำคัญและคุณลักษณะอันพึงประสงค์</p><table class="grid"><tr><th>สมรรถนะการใช้เทคโนโลยี</th><th>คุณลักษณะอันพึงประสงค์</th></tr><tr><td>${listHtml(technologyCompetencyCriteria)}</td><td>${listHtml(characteristicCriteria)}</td></tr></table>
<p class="section">7. กิจกรรมการเรียนรู้</p><table class="grid"><tr><th style="width:18%">คาบ/เวลา</th><th>กิจกรรมการเรียนรู้</th><th style="width:24%">หลักฐาน</th></tr>${plan.phases.map((phase) => `<tr><td><b>${escapeHtml(phase.title)}</b><br>${escapeHtml(phase.period)}</td><td><b>บทบาทครู:</b> ${escapeHtml(phase.teacherRole)}<br><b>บทบาทผู้เรียน:</b> ${escapeHtml(phase.studentRole)}</td><td>${escapeHtml(phase.evidence)}</td></tr>`).join('')}</table>
<p class="section">8. ชิ้นงาน ใบงาน และสื่อ</p><p><b>ชิ้นงาน:</b> ${escapeHtml(plan.product)}</p>${listHtml(plan.worksheet)}${listHtml(plan.resources)}
<p class="section">9. การวัดและประเมินผล</p><table class="grid"><tr><th>สิ่งที่ประเมิน</th><th>วิธีการ/เครื่องมือ</th><th>เกณฑ์ผ่าน</th></tr><tr><td>K ความรู้</td><td>แบบทดสอบหลังเรียน 10 ข้อ</td><td>ตอบถูกอย่างน้อย 6 ข้อ แปลงเป็น K 0-15</td></tr><tr><td>P ทักษะปฏิบัติ</td><td>ชิ้นงานและรูบริกสมรรถนะ ระดับ 0-3</td><td>ค่าเฉลี่ยตั้งแต่ระดับ 2</td></tr><tr><td>A คุณลักษณะ</td><td>แบบสังเกตคุณลักษณะ ระดับ 0-3</td><td>ค่าเฉลี่ยตั้งแต่ระดับ 2</td></tr></table>
<p class="section">10. บันทึกหลังสอน</p><p>ผู้เรียนผ่าน .......... คน คิดเป็นร้อยละ ..........</p><p>สิ่งที่ผู้เรียนทำได้ดี ....................................................................................................</p><p>ปัญหาและสาเหตุ .......................................................................................................</p><p>แนวทางปรับปรุง .........................................................................................................</p>
<div class="signature"><p>ลงชื่อ ........................................................ ครูผู้สอน</p><p>(${escapeHtml(COURSE_TEACHER_NAME)})</p></div>
</body></html>`;

const DownloadPlanButton = ({ plan }: { plan: PrimaryTechnologyCompetencyPlan }) => {
  const download = () => {
    const blob = new Blob(['\ufeff' + buildPlanDocumentHtml(plan)], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `แผนผลลัพธ์ข้อ5_${plan.grade}_${ACADEMIC_YEAR}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return <button type="button" onClick={download}><Download size={17} /> ดาวน์โหลด Word</button>;
};

const RatingField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (score: number) => void;
}) => (
  <label className="ptplan-rating-row">
    <span>{label}</span>
    <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {rubricLevels.map((level) => (
        <option key={level.score} value={level.score}>{level.score} - {level.label}</option>
      ))}
    </select>
  </label>
);

const PrimaryTechnologyPlans: React.FC = () => {
  const toast = useToast();
  const [grade, setGrade] = useState<PrimaryGrade>('ป.1');
  const [view, setView] = useState<View>('plan');
  const [students, setStudents] = useState<StudentInfo[]>(() => loadRoster('ป.1'));
  const [studentCode, setStudentCode] = useState('');
  const [kCorrect, setKCorrect] = useState(0);
  const [competencyScores, setCompetencyScores] = useState<number[]>(emptyScores);
  const [characteristicScores, setCharacteristicScores] = useState<number[]>(emptyScores);
  const [note, setNote] = useState('');
  const [loadedRecordKey, setLoadedRecordKey] = useState('');
  const [saving, setSaving] = useState(false);

  const plan = useMemo(() => getPrimaryTechnologyPlan(grade), [grade]);
  const selectedStudent = useMemo(
    () => students.find((student) => student.studentCode === studentCode),
    [studentCode, students],
  );
  const result = useMemo(() => calculateAssessmentResult({
    kCorrect,
    competencyScores,
    characteristicScores,
    note,
  }), [characteristicScores, competencyScores, kCorrect, note]);
  const currentRecordKey = `${plan.id}:${studentCode}`;
  const loadingRecord = Boolean(studentCode) && loadedRecordKey !== currentRecordKey;

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const rosters = await fetchRostersFromFirebase();
      if (!active) return;
      const nextStudents = rosters[grade] || loadRoster(grade);
      setStudents(nextStudents);
      setStudentCode((current) => (
        nextStudents.some((student) => student.studentCode === current)
          ? current
          : (nextStudents[0]?.studentCode || '')
      ));
    };
    void refresh();
    return () => { active = false; };
  }, [grade]);

  useEffect(() => {
    let active = true;
    if (!studentCode) {
      return undefined;
    }
    const load = async () => {
      const record = await loadPrimaryCompetencyAssessment(plan, studentCode);
      if (!active) return;
      setKCorrect(record?.kCorrect || 0);
      setCompetencyScores(record?.competencyScores || emptyScores());
      setCharacteristicScores(record?.characteristicScores || emptyScores());
      setNote(record?.note || '');
      setLoadedRecordKey(`${plan.id}:${studentCode}`);
    };
    void load();
    return () => { active = false; };
  }, [plan, studentCode]);

  const changeRating = (
    setter: React.Dispatch<React.SetStateAction<number[]>>,
    index: number,
    score: number,
  ) => setter((current) => current.map((value, itemIndex) => (itemIndex === index ? score : value)));

  const saveAssessment = async () => {
    if (!selectedStudent) {
      toast.show('กรุณาเลือกนักเรียนก่อนบันทึก', 'error');
      return;
    }
    setSaving(true);
    try {
      const saved = await savePrimaryCompetencyAssessment(plan, selectedStudent, {
        kCorrect,
        competencyScores,
        characteristicScores,
        note,
      });
      toast.show(`บันทึก Firebase แล้ว: K ${saved.kScore}/15, P ${saved.pLevel}, A ${saved.aPassed ? 'ผ่าน' : 'ยังไม่ผ่าน'}`, 'success');
    } catch (error) {
      toast.show(`บันทึกฐานข้อมูลไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ptplan-shell">
      <header className="ptplan-header">
        <div>
          <span className="ptplan-kicker">แผนพร้อมสอน ปีการศึกษา {ACADEMIC_YEAR}</span>
          <h2>เทคโนโลยี ป.1-6: ผลลัพธ์การเรียนรู้ข้อ 5</h2>
          <p>ครูผู้สอน {COURSE_TEACHER_NAME} | เนื้อหาเขียนขึ้นใหม่จากคำอธิบายรายวิชาและเกณฑ์ประเมินของโรงเรียน</p>
        </div>
        <div className="ptplan-actions">
          <button type="button" className="primary" onClick={() => window.print()}><Printer size={17} /> พิมพ์แผน</button>
          <DownloadPlanButton plan={plan} />
        </div>
      </header>

      <div className="ptplan-grade-switch" aria-label="เลือกระดับชั้น">
        {primaryTechnologyCompetencyPlans.map((item) => (
          <button key={item.grade} type="button" className={grade === item.grade ? 'active' : ''} onClick={() => setGrade(item.grade)}>
            {item.grade}
          </button>
        ))}
      </div>

      <section className="ptplan-summary">
        <div><BookOpen size={20} /><span>เรื่อง</span><strong>{plan.title}</strong></div>
        <div><Users size={20} /><span>เวลาเรียน</span><strong>4 คาบ / 200 นาที</strong></div>
        <div><Award size={20} /><span>หลักฐานย่อย</span><strong>{plan.subIndicators.length} ตัวชี้วัด ว 4.2</strong></div>
        <div><ClipboardCheck size={20} /><span>การประเมิน</span><strong>K/P/A + ชิ้นงาน</strong></div>
      </section>

      <nav className="ptplan-tabs" aria-label="ส่วนของแผน">
        <button type="button" className={view === 'plan' ? 'active' : ''} onClick={() => setView('plan')}><BookOpen size={17} /> แผนฉบับเต็ม</button>
        <button type="button" className={view === 'quiz' ? 'active' : ''} onClick={() => setView('quiz')}><FileQuestion size={17} /> แบบทดสอบ 10 ข้อ</button>
        <button type="button" className={view === 'assessment' ? 'active' : ''} onClick={() => setView('assessment')}><ClipboardCheck size={17} /> บันทึกผล K/P/A</button>
        <button type="button" className={view === 'criteria' ? 'active' : ''} onClick={() => setView('criteria')}><Award size={17} /> เกณฑ์ประเมิน</button>
      </nav>

      {view === 'plan' && (
        <article className="ptplan-document ptplan-paper">
          <header className="ptplan-document-heading">
            <span>แผนการจัดการเรียนรู้แบบฐานสมรรถนะ</span>
            <h3>กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี</h3>
            <p>รายวิชาเทคโนโลยี (วิทยาการคำนวณ)</p>
          </header>

          <div className="ptplan-table-wrap ptplan-meta-table">
            <table>
              <tbody>
                <tr><th>ระดับชั้น</th><td>{plan.grade}</td><th>ปีการศึกษา</th><td>{ACADEMIC_YEAR}</td></tr>
                <tr><th>เรื่อง</th><td>{plan.title}</td><th>เวลาเรียน</th><td>4 คาบ (200 นาที)</td></tr>
                <tr><th>ครูผู้สอน</th><td>{COURSE_TEACHER_NAME}</td><th>กำหนดสอน</th><td>{plan.schedule}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="ptplan-child-brief"><strong>ภารกิจของผู้เรียน</strong><p>{plan.childMission}</p></div>

          <section>
            <h4><span>1</span> ผลลัพธ์การเรียนรู้หลัก</h4>
            <div className="ptplan-outcome"><strong>ข้อ 5</strong><p>{plan.mainOutcome}</p></div>
          </section>

          <section>
            <h4><span>2</span> มาตรฐานและตัวชี้วัดที่ใช้เป็นหลักฐาน</h4>
            <p className="ptplan-standard"><strong>มาตรฐาน ว 4.2</strong> เข้าใจและใช้แนวคิดเชิงคำนวณในการแก้ปัญหา ใช้เทคโนโลยีสารสนเทศและการสื่อสารในการเรียนรู้ การทำงาน และการแก้ปัญหาได้อย่างมีประสิทธิภาพ รู้เท่าทัน และมีจริยธรรม</p>
            <div className="ptplan-table-wrap">
              <table className="ptplan-formal-table">
                <thead><tr><th>ตัวชี้วัด</th><th>พฤติกรรมที่ใช้เป็นหลักฐาน</th></tr></thead>
                <tbody>{plan.subIndicators.map((indicator) => <tr key={indicator.id}><td><strong>{indicator.code}</strong></td><td>{indicator.description}</td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section>
            <h4><span>3</span> จุดประสงค์การเรียนรู้ K/P/A</h4>
            <div className="ptplan-table-wrap">
              <table className="ptplan-formal-table ptplan-objective-table">
                <thead><tr><th>ด้าน</th><th>เมื่อจบกิจกรรม ผู้เรียนสามารถ</th><th>หลักฐานสำคัญ</th></tr></thead>
                <tbody>
                  <tr><td><b className="ptplan-kpa-mark k">K</b></td><td>{plan.objectives.k}</td><td>แบบทดสอบหลังเรียน</td></tr>
                  <tr><td><b className="ptplan-kpa-mark p">P</b></td><td>{plan.objectives.p}</td><td>ชิ้นงานและการปฏิบัติ</td></tr>
                  <tr><td><b className="ptplan-kpa-mark a">A</b></td><td>{plan.objectives.a}</td><td>แบบสังเกตพฤติกรรม</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="ptplan-prose-grid">
            <div><h4><span>4</span> สาระสำคัญ</h4><p>{plan.concept}</p></div>
            <div><h4><span>5</span> สาระการเรียนรู้</h4><ul>{plan.content.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </section>

          <section>
            <h4><span>6</span> สมรรถนะสำคัญและคุณลักษณะอันพึงประสงค์</h4>
            <div className="ptplan-table-wrap">
              <table className="ptplan-formal-table ptplan-competency-table">
                <thead><tr><th>สมรรถนะการใช้เทคโนโลยี</th><th>คุณลักษณะอันพึงประสงค์</th></tr></thead>
                <tbody><tr><td><ol>{technologyCompetencyCriteria.map((item) => <li key={item}>{item}</li>)}</ol></td><td><ol>{characteristicCriteria.map((item) => <li key={item}>{item}</li>)}</ol></td></tr></tbody>
              </table>
            </div>
          </section>

          <section>
            <h4><span>7</span> กระบวนการจัดกิจกรรมการเรียนรู้ 4 คาบ</h4>
            <div className="ptplan-table-wrap">
              <table className="ptplan-formal-table ptplan-activity-table">
                <thead><tr><th>คาบ/เวลา</th><th>กิจกรรมการเรียนรู้</th><th>หลักฐาน</th></tr></thead>
                <tbody>
                  {plan.phases.map((phase, index) => (
                    <tr key={phase.title}>
                      <td><span className="ptplan-period-number">{index + 1}</span><strong>{phase.title}</strong><small>{phase.period}</small></td>
                      <td><p><strong>บทบาทครู:</strong> {phase.teacherRole}</p><p><strong>บทบาทผู้เรียน:</strong> {phase.studentRole}</p></td>
                      <td>{phase.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h4><span>8</span> ชิ้นงาน ใบงาน สื่อ และการช่วยเหลือผู้เรียน</h4>
            <p><strong>ชิ้นงานหลัก:</strong> {plan.product}</p>
            <div className="ptplan-resource-columns">
              <div><h5>ใบงาน</h5><ul>{plan.worksheet.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h5>สื่อและแหล่งเรียนรู้</h5><ul>{plan.resources.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h5>การช่วยเหลือและต่อยอด</h5><ul>{plan.support.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
          </section>

          <section>
            <h4><span>9</span> การวัดและประเมินผล</h4>
            <div className="ptplan-table-wrap">
              <table className="ptplan-formal-table ptplan-measure-table">
                <thead><tr><th>สิ่งที่ประเมิน</th><th>วิธีการ</th><th>เครื่องมือ/หลักฐาน</th><th>เกณฑ์ผ่าน</th></tr></thead>
                <tbody>
                  <tr><td><strong>K ความรู้</strong></td><td>ตรวจคำตอบหลังเรียน</td><td>แบบทดสอบ 10 ข้อ</td><td>ถูกอย่างน้อย 6 ข้อ แปลงเป็น K 0-15</td></tr>
                  <tr><td><strong>P ทักษะปฏิบัติ</strong></td><td>ประเมินระหว่างทำงานและชิ้นงาน</td><td>รูบริกสมรรถนะ 5 รายการ ระดับ 0-3</td><td>ค่าเฉลี่ยตั้งแต่ระดับ 2</td></tr>
                  <tr><td><strong>A คุณลักษณะ</strong></td><td>สังเกตพฤติกรรมต่อเนื่อง</td><td>แบบสังเกต 5 รายการ ระดับ 0-3</td><td>ค่าเฉลี่ยตั้งแต่ระดับ 2</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="ptplan-reflection">
            <h4><span>10</span> บันทึกหลังสอน</h4>
            <div className="ptplan-reflection-grid">
              <p>ผู้เรียนผ่าน .......... คน คิดเป็นร้อยละ ..........</p>
              <p>ผู้เรียนที่ต้องได้รับการช่วยเหลือ .......... คน</p>
            </div>
            <label>สิ่งที่ผู้เรียนทำได้ดี<span /></label>
            <label>ปัญหาและสาเหตุ<span /></label>
            <label>แนวทางปรับปรุงครั้งถัดไป<span /></label>
            <div className="ptplan-signature"><p>ลงชื่อ ........................................................ ครูผู้สอน</p><strong>({COURSE_TEACHER_NAME})</strong></div>
          </section>
        </article>
      )}

      {view === 'quiz' && (
        <section className="ptplan-view ptplan-quiz">
          <div className="ptplan-section-heading"><div><h3>แบบทดสอบต้นฉบับ {plan.grade}</h3><p>ใช้หลังจบกิจกรรม 10 ข้อ ข้อละ 1 คะแนน ผ่านอย่างน้อย 6 คะแนน</p></div><FileQuestion size={28} /></div>
          <ol>
            {plan.quiz.map((item) => (
              <li key={item.question}><p>{item.question}</p><details><summary>ดูแนวคำตอบ</summary><span>{item.answerGuide}</span></details></li>
            ))}
          </ol>
        </section>
      )}

      {view === 'assessment' && (
        <section className="ptplan-view ptplan-form">
          <div className="ptplan-section-heading"><div><h3>บันทึกผลรายบุคคล</h3><p>บันทึกครั้งเดียว ระบบส่งคะแนนไปยัง {plan.subIndicators.map((item) => item.code).join(', ')} และ Firebase</p></div><ClipboardCheck size={28} /></div>

          <div className="ptplan-student-row">
            <label>นักเรียน<select value={studentCode} onChange={(event) => setStudentCode(event.target.value)}>{students.map((student) => <option key={student.studentCode} value={student.studentCode}>เลขที่ {student.no} {student.name}</option>)}</select></label>
            <label>แบบทดสอบถูก<input type="number" min={0} max={10} value={kCorrect} onChange={(event) => setKCorrect(Math.max(0, Math.min(10, Number(event.target.value))))} /><span>/ 10 ข้อ</span></label>
          </div>

          {loadingRecord ? <p className="ptplan-loading">กำลังอ่านผลประเมินจากฐานข้อมูล...</p> : (
            <div className="ptplan-rating-grid">
              <fieldset><legend>P: สมรรถนะการใช้เทคโนโลยี</legend>{technologyCompetencyCriteria.map((criterion, index) => <RatingField key={criterion} label={criterion} value={competencyScores[index]} onChange={(score) => changeRating(setCompetencyScores, index, score)} />)}</fieldset>
              <fieldset><legend>A: คุณลักษณะอันพึงประสงค์</legend>{characteristicCriteria.map((criterion, index) => <RatingField key={criterion} label={criterion} value={characteristicScores[index]} onChange={(score) => changeRating(setCharacteristicScores, index, score)} />)}</fieldset>
            </div>
          )}

          <label className="ptplan-note">บันทึกจากครู<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="จุดเด่น สิ่งที่ควรพัฒนา หรือหลักฐานเพิ่มเติม" /></label>

          <div className="ptplan-result">
            <div><span>K</span><strong>{result.kScore}/15</strong><small>{result.kCorrect}/10 ข้อ</small></div>
            <div><span>P</span><strong>{result.pLevel}</strong><small>เฉลี่ย {result.competencyAverage.toFixed(2)}/3</small></div>
            <div className={result.aPassed ? 'pass' : ''}><span>A</span><strong>{result.aPassed ? 'ผ่าน' : 'ยังไม่ผ่าน'}</strong><small>เฉลี่ย {result.characteristicAverage.toFixed(2)}/3</small></div>
            <button type="button" onClick={saveAssessment} disabled={saving || loadingRecord || !selectedStudent}><Save size={18} /> {saving ? 'กำลังบันทึก...' : 'บันทึก Firebase และสมุดคะแนน'}</button>
          </div>
        </section>
      )}

      {view === 'criteria' && (
        <section className="ptplan-view">
          <div className="ptplan-section-heading"><div><h3>เกณฑ์ประเมินของโรงเรียน</h3><p>ใช้ระดับเดียวกับแบบประเมินคุณลักษณะและสมรรถนะ 5 ด้าน</p></div><Award size={28} /></div>
          <div className="ptplan-rubric-levels">{rubricLevels.map((level) => <div key={level.score}><strong>{level.score}</strong><span>{level.label}</span><p>{level.description}</p></div>)}</div>
          <div className="ptplan-criteria-columns">
            <div><h4>สมรรถนะด้านการใช้เทคโนโลยี</h4><ol>{technologyCompetencyCriteria.map((item) => <li key={item}>{item}</li>)}</ol></div>
            <div><h4>คุณลักษณะอันพึงประสงค์</h4><ol>{characteristicCriteria.map((item) => <li key={item}>{item}</li>)}</ol></div>
          </div>
          <div className="ptplan-score-note"><CheckCircle2 size={20} /><p><strong>การเชื่อมคะแนน:</strong> K จากแบบทดสอบ 10 ข้อแปลงเป็น 15 คะแนน, P จากค่าเฉลี่ยสมรรถนะ, A ผ่านเมื่อคุณลักษณะเฉลี่ยตั้งแต่ระดับ 2 และใช้เป็นหลักฐานให้ตัวชี้วัดย่อยทุกข้อของแผน</p></div>
        </section>
      )}
    </div>
  );
};

export default PrimaryTechnologyPlans;
