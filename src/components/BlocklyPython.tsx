import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';
import * as ThMsg from 'blockly/msg/en';

// โหลด locale (ใช้อังกฤษเป็นฐาน — ป้ายหมวดเป็นไทยใน toolbox)
Blockly.setLocale(ThMsg as unknown as Record<string, string>);

interface Props {
  onCode: (code: string) => void;
}

// Toolbox: หมวดหมู่บล็อก (ป้ายไทย) พร้อมบล็อกมาตรฐานที่พอสร้างโจทย์ได้
const TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category', name: '📤 พิมพ์/ข้อความ', colour: '#5b80a5',
      contents: [
        { kind: 'block', type: 'text_print' },
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'text_join' },
      ],
    },
    {
      kind: 'category', name: '🔢 คณิต', colour: '#5b67a5',
      contents: [
        { kind: 'block', type: 'math_number', fields: { NUM: 0 } },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_modulo' },
      ],
    },
    {
      kind: 'category', name: '🔁 วนซ้ำ', colour: '#5ba55b',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 5 } } } } },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_for', inputs: {
          FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
          TO: { shadow: { type: 'math_number', fields: { NUM: 5 } } },
          BY: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
        } },
      ],
    },
    {
      kind: 'category', name: '❓ เงื่อนไข', colour: '#a5995b',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    { kind: 'category', name: '📦 ตัวแปร', colour: '#a55b80', custom: 'VARIABLE' },
    { kind: 'category', name: '🧩 ฟังก์ชัน', colour: '#995ba5', custom: 'PROCEDURE' },
  ],
};

const START_XML =
  '<xml xmlns="https://developers.google.com/blockly/xml">' +
  '<block type="text_print" x="30" y="30"><value name="TEXT">' +
  '<shadow type="text"><field name="TEXT">สวัสดีครับ</field></shadow>' +
  '</value></block></xml>';

const BlocklyPython: React.FC<Props> = ({ onCode }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    if (!divRef.current) return;
    const ws = Blockly.inject(divRef.current, {
      toolbox: TOOLBOX,
      trashcan: true,
      scrollbars: true,
      grid: { spacing: 22, length: 3, colour: '#e5e7eb', snap: true },
      zoom: { controls: true, wheel: true, startScale: 0.95, maxScale: 2, minScale: 0.5 },
      move: { scrollbars: true, drag: true, wheel: true },
      renderer: 'zelos',
    });
    wsRef.current = ws;

    // โหลดบล็อกเริ่มต้น
    try {
      const dom = Blockly.utils.xml.textToDom(START_XML);
      Blockly.Xml.domToWorkspace(dom, ws);
    } catch { /* ignore */ }

    const emit = () => {
      try {
        const code = pythonGenerator.workspaceToCode(ws);
        onCode(code);
      } catch { /* ignore */ }
    };
    emit();
    ws.addChangeListener(emit);

    // ปรับขนาดเมื่อ container เปลี่ยน
    const ro = new ResizeObserver(() => Blockly.svgResize(ws));
    ro.observe(divRef.current);

    return () => {
      ro.disconnect();
      ws.dispose();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={divRef}
      style={{
        width: '100%', height: 380,
        border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden',
      }}
    />
  );
};

export default BlocklyPython;
