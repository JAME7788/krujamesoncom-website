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

const buildPlanText = (plan: PrimaryTechnologyCompetencyPlan) => {
  const lines = [
    `แผนการจัดการเรียนรู้ รายวิชาเทคโนโลยี ${plan.grade}`,
    `ปีการศึกษา ${ACADEMIC_YEAR} | ครูผู้สอน ${COURSE_TEACHER_NAME}`,
    `เรื่อง ${plan.title} | เวลา 4 คาบ (200 นาที) | ${plan.schedule}`,
    '',
    '1. ผลลัพธ์การเรียนรู้หลัก',
    `ข้อ 5 ${plan.mainOutcome}`,
    '',
    '2. ตัวชี้วัดย่อยที่ใช้เป็นหลักฐาน',
    ...plan.subIndicators.map((item) => `${item.code} ${item.description}`),
    '',
    '3. จุดประสงค์การเรียนรู้',
    `K: ${plan.objectives.k}`,
    `P: ${plan.objectives.p}`,
    `A: ${plan.objectives.a}`,
    '',
    '4. สาระสำคัญ',
    plan.concept,
    '',
    '5. สาระการเรียนรู้',
    ...plan.content.map((item) => `- ${item}`),
    '',
    '6. การจัดกิจกรรมการเรียนรู้',
  ];
  plan.phases.forEach((phase) => {
    lines.push(`${phase.title} (${phase.period})`);
    lines.push(`บทบาทครู: ${phase.teacherRole}`);
    lines.push(`บทบาทผู้เรียน: ${phase.studentRole}`);
    lines.push(`หลักฐาน: ${phase.evidence}`, '');
  });
  lines.push('7. ชิ้นงานและใบงาน', `ชิ้นงาน: ${plan.product}`, ...plan.worksheet.map((item) => `- ${item}`), '');
  lines.push('8. สื่อและแหล่งเรียนรู้', ...plan.resources.map((item) => `- ${item}`), '');
  lines.push('9. การวัดและประเมินผล', 'K: แบบทดสอบต้นฉบับ 10 ข้อ ผ่านอย่างน้อย 6 ข้อ แปลงเป็นคะแนน K 0-15', 'P: รูบริกสมรรถนะการใช้เทคโนโลยี 5 รายการ ระดับ 0-3', 'A: แบบสังเกตคุณลักษณะ 5 รายการ ระดับ 0-3 ผ่านเมื่อเฉลี่ยระดับ 2 ขึ้นไป', '');
  lines.push('10. แบบทดสอบพร้อมแนวคำตอบ');
  plan.quiz.forEach((item, index) => lines.push(`${index + 1}. ${item.question}`, `แนวคำตอบ: ${item.answerGuide}`));
  lines.push('', '11. บันทึกหลังสอน', 'จำนวนผู้เรียนที่ผ่าน _____ คน คิดเป็นร้อยละ _____', 'สิ่งที่ทำได้ดี: ______________________________________________', 'ปัญหาและสาเหตุ: _____________________________________________', 'แนวทางปรับปรุง: _____________________________________________');
  return lines.join('\n');
};

const DownloadPlanButton = ({ plan }: { plan: PrimaryTechnologyCompetencyPlan }) => {
  const download = () => {
    const blob = new Blob(['\ufeff' + buildPlanText(plan)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `แผนผลลัพธ์ข้อ5_${plan.grade}_${ACADEMIC_YEAR}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return <button type="button" onClick={download}><Download size={17} /> ดาวน์โหลดแผน</button>;
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
        <article className="ptplan-document">
          <div className="ptplan-title-block">
            <span>{plan.grade} | {plan.schedule}</span>
            <h3>{plan.title}</h3>
            <p className="ptplan-mission">ภารกิจสำหรับเด็ก: {plan.childMission}</p>
          </div>

          <section>
            <h4>1. ผลลัพธ์การเรียนรู้หลัก</h4>
            <div className="ptplan-outcome"><strong>ข้อ 5</strong><p>{plan.mainOutcome}</p></div>
          </section>

          <section>
            <h4>2. ตัวชี้วัด ว 4.2 ที่เป็นหลักฐานย่อย</h4>
            <div className="ptplan-indicators">
              {plan.subIndicators.map((indicator) => (
                <div key={indicator.id}><strong>{indicator.code}</strong><p>{indicator.description}</p></div>
              ))}
            </div>
          </section>

          <section>
            <h4>3. จุดประสงค์การเรียนรู้ K/P/A</h4>
            <div className="ptplan-kpa">
              <div><strong>K</strong><p>{plan.objectives.k}</p></div>
              <div><strong>P</strong><p>{plan.objectives.p}</p></div>
              <div><strong>A</strong><p>{plan.objectives.a}</p></div>
            </div>
          </section>

          <section className="ptplan-two-columns">
            <div><h4>4. สาระสำคัญ</h4><p>{plan.concept}</p></div>
            <div><h4>5. สาระการเรียนรู้</h4><ul>{plan.content.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </section>

          <section>
            <h4>6. กระบวนการจัดการเรียนรู้ 4 คาบ</h4>
            <div className="ptplan-timeline">
              {plan.phases.map((phase, index) => (
                <div className="ptplan-phase" key={phase.title}>
                  <div className="ptplan-phase-number">{index + 1}</div>
                  <div>
                    <h5>{phase.title} <span>{phase.period}</span></h5>
                    <p><strong>บทบาทครู:</strong> {phase.teacherRole}</p>
                    <p><strong>บทบาทผู้เรียน:</strong> {phase.studentRole}</p>
                    <p className="evidence"><strong>หลักฐาน:</strong> {phase.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ptplan-two-columns">
            <div><h4>7. ใบงานและชิ้นงาน</h4><p><strong>ชิ้นงาน:</strong> {plan.product}</p><ul>{plan.worksheet.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div><h4>8. สื่อและการช่วยเหลือ</h4><ul>{plan.resources.map((item) => <li key={item}>{item}</li>)}</ul><h5>ปรับตามความต้องการผู้เรียน</h5><ul>{plan.support.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </section>

          <section>
            <h4>9. การวัดและประเมินผล</h4>
            <div className="ptplan-assessment-map">
              <div><strong>K ความรู้</strong><p>แบบทดสอบ 10 ข้อ ผ่าน 6 ข้อ แปลงเป็น K 0-15</p></div>
              <div><strong>P กระบวนการ</strong><p>ชิ้นงานและรูบริกสมรรถนะเทคโนโลยี 5 รายการ ระดับ 0-3</p></div>
              <div><strong>A คุณลักษณะ</strong><p>สังเกต 5 รายการ ระดับ 0-3 ผ่านเมื่อเฉลี่ย 2 ขึ้นไป</p></div>
            </div>
          </section>

          <section className="ptplan-reflection">
            <h4>10. บันทึกหลังสอน</h4>
            <p>ผู้เรียนผ่าน _____ คน คิดเป็นร้อยละ _____</p>
            <p>สิ่งที่ผู้เรียนทำได้ดี ............................................................................................................................</p>
            <p>ปัญหาและสาเหตุ ...................................................................................................................................</p>
            <p>แนวทางปรับปรุงครั้งถัดไป ....................................................................................................................</p>
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
