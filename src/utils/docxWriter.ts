// ตัวสร้างไฟล์ .docx จริงในเบราว์เซอร์ โดยไม่ต้องเพิ่มไลบรารีภายนอก
//
// ทำไมต้องเขียนเอง: ของเดิมในระบบส่งออกเป็น HTML แล้วตั้งนามสกุลเป็น .doc
// ซึ่ง Word เปิดได้ก็จริงแต่ไม่ใช่ไฟล์ Word แท้ ฟอร์แมตเพี้ยนเวลาแก้ต่อ
// และเอกสารราชการที่ต้องส่งจริงควรเป็น .docx แท้
//
// .docx คือไฟล์ ZIP ที่ข้างในเป็น XML เราจึงเขียน ZIP เองได้
// ใช้แบบ stored (ไม่บีบอัด) ซึ่ง Word รองรับปกติ และทำให้โค้ดสั้นและตรวจสอบง่าย

const encoder = new TextEncoder();

/** ตาราง CRC32 สร้างครั้งเดียวแล้วใช้ซ้ำ */
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (data: Uint8Array): number => {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
};

interface ZipEntry {
  name: string;
  data: Uint8Array;
  crc: number;
  offset: number;
}

const writeUint32 = (arr: number[], value: number) => {
  arr.push(value & 0xFF, (value >>> 8) & 0xFF, (value >>> 16) & 0xFF, (value >>> 24) & 0xFF);
};

const writeUint16 = (arr: number[], value: number) => {
  arr.push(value & 0xFF, (value >>> 8) & 0xFF);
};

/**
 * รวมไฟล์หลายไฟล์เป็น ZIP เดียว (แบบ stored)
 * ตั้งธง 0x0800 เพื่อบอกว่าชื่อไฟล์เป็น UTF-8 แม้ชื่อไฟล์ในเอกสารนี้จะเป็น ASCII ทั้งหมด
 */
export const createZip = (files: Array<{ name: string; content: string }>): Blob => {
  const entries: ZipEntry[] = [];
  const chunks: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const data = encoder.encode(file.content);
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(data);

    const header: number[] = [];
    writeUint32(header, 0x04034b50);
    writeUint16(header, 20);      // version needed
    writeUint16(header, 0x0800);  // flag: ชื่อไฟล์เป็น UTF-8
    writeUint16(header, 0);       // stored
    writeUint16(header, 0);       // mod time
    writeUint16(header, 0x21);    // mod date (1 ม.ค. 1980)
    writeUint32(header, crc);
    writeUint32(header, data.length);
    writeUint32(header, data.length);
    writeUint16(header, nameBytes.length);
    writeUint16(header, 0);       // extra length

    const headerBytes = new Uint8Array(header);
    chunks.push(headerBytes, nameBytes, data);
    entries.push({ name: file.name, data, crc, offset });
    offset += headerBytes.length + nameBytes.length + data.length;
  }

  const cdStart = offset;
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const cd: number[] = [];
    writeUint32(cd, 0x02014b50);
    writeUint16(cd, 20);          // version made by
    writeUint16(cd, 20);          // version needed
    writeUint16(cd, 0x0800);
    writeUint16(cd, 0);
    writeUint16(cd, 0);
    writeUint16(cd, 0x21);
    writeUint32(cd, entry.crc);
    writeUint32(cd, entry.data.length);
    writeUint32(cd, entry.data.length);
    writeUint16(cd, nameBytes.length);
    writeUint16(cd, 0);           // extra
    writeUint16(cd, 0);           // comment
    writeUint16(cd, 0);           // disk number
    writeUint16(cd, 0);           // internal attrs
    writeUint32(cd, 0);           // external attrs
    writeUint32(cd, entry.offset);

    const cdBytes = new Uint8Array(cd);
    chunks.push(cdBytes, nameBytes);
    offset += cdBytes.length + nameBytes.length;
  }

  const end: number[] = [];
  writeUint32(end, 0x06054b50);
  writeUint16(end, 0);
  writeUint16(end, 0);
  writeUint16(end, entries.length);
  writeUint16(end, entries.length);
  writeUint32(end, offset - cdStart);
  writeUint32(end, cdStart);
  writeUint16(end, 0);
  chunks.push(new Uint8Array(end));

  return new Blob(chunks as BlobPart[], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
};

export const escapeXml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export interface DocxRun {
  text: string;
  bold?: boolean;
  underline?: boolean;
}

export interface DocxParagraph {
  runs: DocxRun[];
  align?: 'left' | 'center' | 'right' | 'both';
  /** ระยะเยื้องซ้าย หน่วย twip (1 ซม. ประมาณ 567) */
  indentLeft?: number;
  /** เยื้องบรรทัดแรก หน่วย twip */
  indentFirstLine?: number;
  spaceAfter?: number;
  fontSize?: number;   // หน่วย pt
}

const FONT = 'TH Sarabun New';

const runXml = (run: DocxRun, fontSize: number) => {
  const half = Math.round(fontSize * 2); // Word ใช้ครึ่ง pt
  const props = [
    `<w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"/>`,
    `<w:sz w:val="${half}"/><w:szCs w:val="${half}"/>`,
    run.bold ? '<w:b/><w:bCs/>' : '',
    run.underline ? '<w:u w:val="single"/>' : '',
  ].join('');
  // xml:space="preserve" กันไม่ให้ Word ตัดช่องว่างหัวท้ายทิ้ง
  return `<w:r><w:rPr>${props}</w:rPr><w:t xml:space="preserve">${escapeXml(run.text)}</w:t></w:r>`;
};

const paragraphXml = (p: DocxParagraph) => {
  const size = p.fontSize ?? 16;
  const indent = (p.indentLeft || p.indentFirstLine)
    ? `<w:ind${p.indentLeft ? ` w:left="${p.indentLeft}"` : ''}${p.indentFirstLine ? ` w:firstLine="${p.indentFirstLine}"` : ''}/>`
    : '';
  const align = p.align && p.align !== 'left' ? `<w:jc w:val="${p.align}"/>` : '';
  const spacing = `<w:spacing w:after="${p.spaceAfter ?? 40}" w:line="276" w:lineRule="auto"/>`;
  return `<w:p><w:pPr>${spacing}${indent}${align}</w:pPr>${p.runs.map((r) => runXml(r, size)).join('')}</w:p>`;
};

/** ตัวคั่นหน้า ใช้ขึ้นหน้าใหม่ระหว่างบันทึกแต่ละคาบ */
export const pageBreak = (): DocxParagraph => ({
  runs: [{ text: '' }],
  spaceAfter: 0,
});

const PAGE_BREAK_XML = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

/**
 * สร้างไฟล์ .docx จากรายการย่อหน้า
 * ใช้ตัวคั่น __PAGEBREAK__ แทนตำแหน่งที่ต้องขึ้นหน้าใหม่
 */
export const buildDocx = (paragraphs: Array<DocxParagraph | '__PAGEBREAK__'>): Blob => {
  const body = paragraphs
    .map((p) => (p === '__PAGEBREAK__' ? PAGE_BREAK_XML : paragraphXml(p)))
    .join('');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1021" w:bottom="1134" w:left="1021" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  return createZip([
    { name: '[Content_Types].xml', content: contentTypes },
    { name: '_rels/.rels', content: rels },
    { name: 'word/document.xml', content: documentXml },
  ]);
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // ปล่อย URL ช้าหน่อยเพื่อให้เบราว์เซอร์เริ่มดาวน์โหลดทัน
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
