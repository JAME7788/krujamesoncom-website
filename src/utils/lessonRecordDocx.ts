// สร้างไฟล์ Word ของ "บันทึกผลหลังการจัดกิจกรรมการเรียนรู้"
// ตามแบบฟอร์มราชการของโรงเรียนบ้านคลองมดแดง (ไฟล์ตัวอย่างบันทึกหลังสอน 2569)
//
// เรียงหัวข้อและถ้อยคำให้ตรงต้นฉบับ เพื่อให้ครูเปิดใน Word แล้วแก้ต่อหรือส่งได้เลย
// ใช้ได้กับทุกชั้นและทุกคาบ ไม่ผูกกับข้อมูลชุดใดชุดหนึ่ง

import { buildDocx, downloadBlob, type DocxParagraph } from './docxWriter';

export interface LessonRecordDocData {
  courseName: string;
  gradeLabel: string;        // เช่น "1" สำหรับ ป.1
  unitNo: number | string;
  unitTitle: string;
  planNo: number | string;
  planTitle: string;
  week: number | string;
  day: string;
  month: string;
  buddhistYear: string;
  semester: number | string;
  academicYear: string;
  totalStudents: number;
  passedCount: number;
  summary: string;
  problems: string;
  improvements: string;
  teacherName: string;
  teacherPosition: string;
  deputyName: string;
  directorName: string;
  schoolName: string;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

/** แปลงวันที่ ISO เป็น วัน / เดือนไทย / พ.ศ. สำหรับเติมลงช่องว่างของแบบฟอร์ม */
export const splitIsoToThai = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return { day: '', month: '', buddhistYear: '' };
  return {
    day: String(d),
    month: THAI_MONTHS[m - 1] || '',
    buddhistYear: String(y + 543),
  };
};

export const percentOf = (count: number, total: number): string => {
  if (!total || total <= 0) return '-';
  return (Math.round((count / total) * 1000) / 10).toFixed(1);
};

/** ช่องว่างที่ต้องขีดเส้นใต้ในแบบฟอร์ม — ถ้าไม่มีค่าให้เว้นเป็นจุดไข่ปลาเหมือนต้นฉบับ */
const blank = (value: string | number | undefined, dots = 20) => {
  const text = value === undefined || value === null || value === '' ? '' : String(value);
  if (!text) return { text: '.'.repeat(dots) };
  return { text: ` ${text} `, underline: true };
};

const label = (text: string, bold = false) => ({ text, bold });

export const buildLessonRecordParagraphs = (
  data: LessonRecordDocData,
): Array<DocxParagraph | '__PAGEBREAK__'> => {
  const failed = Math.max(0, data.totalStudents - data.passedCount);
  const passPct = percentOf(data.passedCount, data.totalStudents);
  const failPct = percentOf(failed, data.totalStudents);

  return [
    {
      runs: [label('บันทึกผลหลังการจัดกิจกรรมการเรียนรู้', true)],
      align: 'center',
      fontSize: 18,
      spaceAfter: 220,
    },
    {
      runs: [
        label('รายวิชา'), blank(data.courseName, 30),
        label(' ชั้นประถมศึกษาปีที่ '), blank(data.gradeLabel, 8),
      ],
    },
    {
      runs: [
        label('หน่วยการเรียนรู้ที่ '), blank(data.unitNo, 6),
        label(' เรื่อง '), blank(data.unitTitle, 60),
      ],
    },
    {
      runs: [
        label('แผนการจัดการเรียนรู้ที่ '), blank(data.planNo, 6),
        label(' เรื่อง '), blank(data.planTitle, 55),
      ],
    },
    {
      runs: [
        label('สัปดาห์ที่ '), blank(data.week, 6),
        label(' วันที่ '), blank(data.day, 6),
        label(' เดือน '), blank(data.month, 14),
        label(' พ.ศ. '), blank(data.buddhistYear, 8),
        label(' ภาคเรียนที่ '), blank(data.semester, 5),
        label(' ปีการศึกษา '), blank(data.academicYear, 8),
      ],
      spaceAfter: 140,
    },

    { runs: [label('1. ผลการจัดการเรียนรู้', true)], spaceAfter: 60 },
    {
      runs: [label('นักเรียนจำนวน'), blank(data.totalStudents, 20), label(' คน')],
      indentLeft: 680,
    },
    {
      runs: [
        label('ผ่านจุดประสงค์การเรียนรู้'), blank(data.passedCount, 14),
        label(' คน คิดเป็นร้อยละ '), blank(passPct, 12),
      ],
      indentLeft: 680,
    },
    {
      runs: [
        label('ไม่ผ่านจุดประสงค์การเรียนรู้'), blank(failed, 14),
        label(' คน คิดเป็นร้อยละ '), blank(failPct, 12),
      ],
      indentLeft: 680,
      spaceAfter: 140,
    },

    { runs: [label('2. สรุปผลการจัดการเรียนรู้', true)], spaceAfter: 60 },
    {
      runs: [label(data.summary || '.'.repeat(120))],
      indentFirstLine: 680,
      align: 'both',
      spaceAfter: 140,
    },

    { runs: [label('3. ปัญหาและอุปสรรคระหว่างการจัดกิจกรรมการสอน', true)], spaceAfter: 60 },
    {
      runs: [label(data.problems || '.'.repeat(120))],
      indentFirstLine: 680,
      align: 'both',
      spaceAfter: 140,
    },

    { runs: [label('4. การปรับปรุงและพัฒนา', true)], spaceAfter: 60 },
    {
      runs: [label(data.improvements || '.'.repeat(120))],
      indentFirstLine: 680,
      align: 'both',
      spaceAfter: 300,
    },

    {
      runs: [label('ลงชื่อ………………………………..……………ครูผู้สอน')],
      indentLeft: 4800,
      spaceAfter: 0,
    },
    {
      runs: [label(`( ${data.teacherName} )`)],
      indentLeft: 5400,
      spaceAfter: 0,
    },
    {
      runs: [label(`ตำแหน่ง ${data.teacherPosition}`)],
      indentLeft: 5100,
      spaceAfter: 240,
    },

    {
      runs: [label('ความคิดเห็น (หัวหน้ากลุ่มสาระการเรียนรู้ / หรือผู้ที่ได้รับมอบหมาย)', true)],
      spaceAfter: 60,
    },
    { runs: [label('ได้ทำการตรวจแผนการจัดการเรียนรู้แล้วมีความคิดเห็นดังนี้')], indentLeft: 680 },
    { runs: [label('1. เป็นแผนการจัดการเรียนรู้ที่')], indentLeft: 680 },
    {
      runs: [label('☐ ดีมาก      ☐ ดี      ☐ พอใช้      ☐ ต้องปรับปรุง')],
      indentLeft: 1200,
    },
    { runs: [label('2. การจัดกิจกรรมการเรียนรู้ได้นำเอากระบวนการเรียนรู้')], indentLeft: 680 },
    {
      runs: [label('☐ ที่เน้นผู้เรียนเป็นสำคัญ ใช้ในการสอนได้อย่างเหมาะสม')],
      indentLeft: 1200,
    },
    {
      runs: [label('☐ ที่ยังไม่เน้นผู้เรียนเป็นสำคัญ ควรปรับปรุงพัฒนาต่อไป')],
      indentLeft: 1200,
    },
    { runs: [label('3. เป็นแผนการจัดการเรียนรู้ที่')], indentLeft: 680 },
    {
      runs: [label('☐ นำไปใช้ในการสอนได้      ☐ ควรปรับปรุงก่อนนำไปใช้')],
      indentLeft: 1200,
    },
    { runs: [label('4. ข้อเสนอแนะอื่นๆ')], indentLeft: 680 },
    {
      runs: [label('…………………………………………………………………………………………………………………………………………………………')],
      spaceAfter: 0,
    },
    {
      runs: [label('…………………………………………………………………………………………………………………………………………………………')],
      spaceAfter: 300,
    },

    {
      runs: [label('ลงชื่อ...............................................          ลงชื่อ...................................................')],
      align: 'center',
      spaceAfter: 0,
    },
    {
      runs: [label(`( ${data.deputyName} )                    ( ${data.directorName} )`)],
      align: 'center',
      spaceAfter: 0,
    },
    {
      runs: [label('รองผู้อำนวยการสถานศึกษา                    ผู้อำนวยการสถานศึกษา')],
      align: 'center',
      spaceAfter: 0,
    },
    {
      runs: [label(`${data.schoolName}                    ${data.schoolName}`)],
      align: 'center',
    },
  ];
};

/** ดาวน์โหลดบันทึกหลังสอนเป็นไฟล์ Word จริง หลายคาบรวมเป็นไฟล์เดียว ขึ้นหน้าใหม่ทุกคาบ */
export const downloadLessonRecordDocx = (
  records: LessonRecordDocData[],
  filename: string,
) => {
  const paragraphs: Array<DocxParagraph | '__PAGEBREAK__'> = [];
  records.forEach((record, index) => {
    if (index > 0) paragraphs.push('__PAGEBREAK__');
    paragraphs.push(...buildLessonRecordParagraphs(record));
  });
  downloadBlob(buildDocx(paragraphs), filename);
};
