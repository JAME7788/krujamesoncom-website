import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, CheckCircle2, RefreshCw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import {
  findRosterStudentByNo,
  isAcceptedAnswer,
  scorePaperAnswers,
  type PaperExam,
} from '../services/paperExamService';
import { rgbaToGray, scanAnswerSheets, type SheetReading } from '../utils/omrScanner';

export interface LiveCapturePayload {
  source: HTMLCanvasElement;
  reading: SheetReading;
  exam: PaperExam | null;
  autoSaveRequested: boolean;
}

interface LiveOmrCameraScannerProps {
  currentExam: PaperExam;
  examsByCode: ReadonlyMap<number, PaperExam>;
  onCaptured: (payload: LiveCapturePayload) => void;
}

const SCAN_INTERVAL_MS = 240;
const LOCK_STREAK_REQUIRED = 2;
const DUPLICATE_COOLDOWN_MS = 3500;
const MAX_VIDEO_SCAN_WIDTH = 860;

/** เล่นเสียงติ๊ดสั้น ๆ แบบ ZipGrade ผ่าน Web Audio API (ไม่ใช้ไฟล์เสียงภายนอก) */
const playBeepSound = (success = true) => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const now = ctx.currentTime;
    if (success) {
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.075);
    } else {
      osc.frequency.setValueAtTime(520, now);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
    window.setTimeout(() => { void ctx.close().catch(() => {}); }, 300);
  } catch {
    // ignore audio autoplay block
  }
};

const drawGuideBrackets = (ctx: CanvasRenderingContext2D, w: number, h: number, locked: boolean) => {
  const padX = Math.round(w * 0.08);
  const padY = Math.round(h * 0.1);
  const len = Math.round(Math.min(w, h) * 0.09);
  ctx.save();
  ctx.strokeStyle = locked ? 'rgba(34, 197, 94, 0.95)' : 'rgba(255, 255, 255, 0.78)';
  ctx.lineWidth = Math.max(3, Math.round(w * 0.005));
  ctx.lineCap = 'round';
  const corners = [
    [padX, padY, 1, 1],
    [w - padX, padY, -1, 1],
    [padX, h - padY, 1, -1],
    [w - padX, h - padY, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * len);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * len, cy);
    ctx.stroke();
  }
  ctx.restore();
};

const drawReadingOverlay = (
  ctx: CanvasRenderingContext2D,
  reading: SheetReading,
  exam: PaperExam | null,
  scaleX: number,
  scaleY: number,
) => {
  ctx.save();
  ctx.strokeStyle = exam ? '#22c55e' : '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  reading.corners.forEach((p, idx) => {
    const x = p.x * scaleX;
    const y = p.y * scaleY;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();

  // วาดจุดมุมทั้ง 4
  ctx.fillStyle = '#22c55e';
  for (const p of reading.corners) {
    ctx.beginPath();
    ctx.arc(p.x * scaleX, p.y * scaleY, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // วาดวงกลมผลตรวจสดบนวิดีโอ (เขียว = ถูก, แดง = ผิด, ส้ม = เฉลยที่ไม่ได้เลือก)
  ctx.lineWidth = 2.4;
  for (const b of reading.bubbles) {
    if (b.kind !== 'answer') continue;
    const chosen = reading.answers[b.index] === b.choice;
    const mask = exam?.keyMasks[b.index] ?? 0;
    const isKey = ((mask >> b.choice) & 1) === 1;
    if (chosen) {
      ctx.strokeStyle = mask === 0 ? '#38bdf8' : isKey ? '#22c55e' : '#ef4444';
    } else if (isKey && !isAcceptedAnswer(mask, reading.answers[b.index])) {
      ctx.strokeStyle = '#f59e0b';
    } else {
      continue;
    }
    ctx.beginPath();
    ctx.arc(b.x * scaleX, b.y * scaleY, Math.max(4, b.r * scaleX * 1.3), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
};

const readingSignature = (reading: SheetReading): string =>
  `${reading.examCode ?? 'x'}|${reading.studentNo ?? 'x'}|${reading.answers.map((a) => (a === null ? '-' : a)).join('')}`;

export const LiveOmrCameraScanner: React.FC<LiveOmrCameraScannerProps> = ({
  currentExam,
  examsByCode,
  onCaptured,
}) => {
  const [active, setActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [autoSave, setAutoSave] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('กด “เปิดกล้องสแกนสด” แล้วส่องกระดาษคำตอบให้ครบ 4 มุมดำ');
  const [flashBanner, setFlashBanner] = useState<string | null>(null);
  const [scannedCount, setScannedCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastSigRef = useRef<{ sig: string; streak: number }>({ sig: '', streak: 0 });
  const recentCapturesRef = useRef<Map<string, number>>(new Map());
  const latestFrameRef = useRef<{ reading: SheetReading; exam: PaperExam | null } | null>(null);

  const propsRef = useRef({ currentExam, examsByCode, autoSave, soundOn, onCaptured });
  useEffect(() => {
    propsRef.current = { currentExam, examsByCode, autoSave, soundOn, onCaptured };
  }, [currentExam, examsByCode, autoSave, soundOn, onCaptured]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    latestFrameRef.current = null;
    lastSigRef.current = { sig: '', streak: 0 };
    setActive(false);
    setStatusText('ปิดกล้องแล้ว • กดเปิดกล้องเมื่อพร้อมสแกนต่อ');
  }, []);

  const startCamera = useCallback(async (requestedFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('เบราว์เซอร์นี้ไม่รองรับการเปิดกล้องสด กรุณาใช้ปุ่ม “ถ่ายรูป / อัปโหลดจากเครื่อง” แทน');
      return;
    }
    stopCamera();
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: requestedFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback กรณีกล้องคอมพิวเตอร์ไม่มี facingMode environment
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      setActive(true);
      setStatusText('กำลังมองหาสี่เหลี่ยมดำทั้ง 4 มุมบนกระดาษคำตอบ…');
      window.setTimeout(() => {
        const video = videoRef.current;
        if (video && streamRef.current) {
          video.srcObject = streamRef.current;
          void video.play().catch(() => {});
        }
      }, 30);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setCameraError(`เปิดกล้องไม่ได้: ${msg} (ตรวจสิทธิ์การเข้าถึงกล้องในเบราว์เซอร์ หรือใช้การอัปโหลดรูปแทน)`);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const emitCapture = useCallback((reading: SheetReading, exam: PaperExam | null, forceManual: boolean) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const snapshot = document.createElement('canvas');
    const scale = Math.min(1, 1400 / Math.max(video.videoWidth, video.videoHeight));
    snapshot.width = Math.round(video.videoWidth * scale);
    snapshot.height = Math.round(video.videoHeight * scale);
    snapshot.getContext('2d')!.drawImage(video, 0, 0, snapshot.width, snapshot.height);

    // สแกนซ้ำบนภาพความละเอียดเต็มเพื่อให้พิกัด overlay บน ScanCard ตรง 100%
    const { examsByCode: byCode, currentExam: curExam, autoSave: allowAuto, soundOn: withSound, onCaptured: emit } = propsRef.current;
    const { data } = snapshot.getContext('2d')!.getImageData(0, 0, snapshot.width, snapshot.height);
    const fullScan = scanAnswerSheets(
      rgbaToGray(data, snapshot.width, snapshot.height),
      (code) => {
        const found = code === null ? undefined : byCode.get(code);
        return found ? { questionCount: found.questionCount, choiceCount: found.choiceCount } : null;
      },
      { questionCount: curExam.questionCount, choiceCount: curExam.choiceCount },
    );
    const finalReading = fullScan.sheets[0] ?? reading;
    const matchedExam = finalReading.examCode !== null ? (byCode.get(finalReading.examCode) ?? exam) : exam;
    const student = matchedExam ? findRosterStudentByNo(matchedExam.classroom, finalReading.studentNo) : undefined;
    const result = matchedExam ? scorePaperAnswers(matchedExam, finalReading.answers) : null;

    if (withSound) playBeepSound(Boolean(matchedExam && finalReading.studentNo !== null));
    const label = matchedExam && result
      ? `${student ? `เลขที่ ${student.no} ${student.name}` : finalReading.studentNo !== null ? `เลขที่ ${finalReading.studentNo}` : 'ไม่พบเลขที่'} • ${result.score}/${result.total} (${result.total ? Math.round((result.score / result.total) * 100) : 0}%)`
      : 'จับภาพกระดาษคำตอบแล้ว — ตรวจสอบรายละเอียดด้านล่าง';
    setFlashBanner(label);
    setScannedCount((c) => c + 1);
    window.setTimeout(() => {
      setFlashBanner((prev) => (prev === label ? null : prev));
    }, 2600);

    const canAutoSave = !forceManual && allowAuto && Boolean(matchedExam) && finalReading.studentNo !== null && finalReading.issues.length === 0;
    emit({
      source: snapshot,
      reading: finalReading,
      exam: matchedExam,
      autoSaveRequested: canAutoSave,
    });
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setInterval(() => {
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (!video || !overlay || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

      const scale = Math.min(1, MAX_VIDEO_SCAN_WIDTH / video.videoWidth);
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      if (!workCanvasRef.current) workCanvasRef.current = document.createElement('canvas');
      const work = workCanvasRef.current;
      if (work.width !== w || work.height !== h) {
        work.width = w;
        work.height = h;
      }
      const wCtx = work.getContext('2d', { willReadFrequently: true });
      if (!wCtx) return;
      wCtx.drawImage(video, 0, 0, w, h);
      const { data } = wCtx.getImageData(0, 0, w, h);

      const { examsByCode: byCode, currentExam: curExam } = propsRef.current;
      const scan = scanAnswerSheets(
        rgbaToGray(data, w, h),
        (code) => {
          const found = code === null ? undefined : byCode.get(code);
          return found ? { questionCount: found.questionCount, choiceCount: found.choiceCount } : null;
        },
        { questionCount: curExam.questionCount, choiceCount: curExam.choiceCount },
      );

      if (overlay.width !== video.videoWidth || overlay.height !== video.videoHeight) {
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;
      }
      const oCtx = overlay.getContext('2d')!;
      oCtx.clearRect(0, 0, overlay.width, overlay.height);

      const sheet = scan.sheets[0];
      drawGuideBrackets(oCtx, overlay.width, overlay.height, Boolean(sheet));

      if (!sheet) {
        latestFrameRef.current = null;
        lastSigRef.current = { sig: '', streak: 0 };
        setStatusText('จัดกระดาษให้อยู่ในกรอบ ให้เห็นสี่เหลี่ยมดำครบทั้ง 4 มุม');
        return;
      }

      const matchedExam = sheet.examCode !== null ? (byCode.get(sheet.examCode) ?? null) : null;
      latestFrameRef.current = { reading: sheet, exam: matchedExam };
      drawReadingOverlay(oCtx, sheet, matchedExam, overlay.width / w, overlay.height / h);

      const exam = matchedExam ?? curExam;
      const result = scorePaperAnswers(exam, sheet.answers);
      if (sheet.examCode !== null) {
        setStatusText(
          `ล็อกกระดาษแล้ว! รหัสชุด ${sheet.examCode} • เลขที่ ${sheet.studentNo ?? '?'} • ได้ ${result.score}/${result.total} คะแนน (นิ่งไว้ 0.5 วินาทีเพื่อสแกนอัตโนมัติ)`,
        );
      } else {
        setStatusText('พบ 4 มุมแล้ว — ขยับกล้องให้เห็นแถวรหัสชุดข้อสอบด้านบนขวาให้ชัดขึ้น');
      }

      // นับความนิ่งของเฟรมติดต่อกัน (ZipGrade Auto-Lock)
      if (sheet.examCode !== null && matchedExam) {
        const sig = readingSignature(sheet);
        if (lastSigRef.current.sig === sig) {
          lastSigRef.current.streak += 1;
        } else {
          lastSigRef.current = { sig, streak: 1 };
        }
        if (lastSigRef.current.streak >= LOCK_STREAK_REQUIRED) {
          const key = `${sheet.examCode}_${sheet.studentNo ?? 'blank'}`;
          const now = Date.now();
          const lastAt = recentCapturesRef.current.get(key) ?? 0;
          if (now - lastAt >= DUPLICATE_COOLDOWN_MS) {
            recentCapturesRef.current.set(key, now);
            lastSigRef.current = { sig: '', streak: 0 };
            emitCapture(sheet, matchedExam, false);
          }
        }
      }
    }, SCAN_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [active, emitCapture]);

  const handleManualSnap = () => {
    const latest = latestFrameRef.current;
    if (latest) {
      emitCapture(latest.reading, latest.exam, true);
      return;
    }
    // ถ้ายังไม่ล็อก 4 มุม ให้จับเฟรมปัจจุบันส่งเข้า pipeline ตรง ๆ
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
    const scan = scanAnswerSheets(
      rgbaToGray(data, canvas.width, canvas.height),
      (code) => {
        const found = code === null ? undefined : examsByCode.get(code);
        return found ? { questionCount: found.questionCount, choiceCount: found.choiceCount } : null;
      },
      { questionCount: currentExam.questionCount, choiceCount: currentExam.choiceCount },
    );
    if (scan.sheets[0]) {
      const matched = scan.sheets[0].examCode !== null ? (examsByCode.get(scan.sheets[0].examCode) ?? null) : null;
      emitCapture(scan.sheets[0], matched, true);
    } else {
      setCameraError(scan.error || 'ยังมองไม่เห็นมุมดำทั้ง 4 มุม ลองถือกล้องให้นิ่งและสว่างขึ้น');
    }
  };

  const toggleFacing = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (active) void startCamera(next);
  };

  return (
    <div className="exam-live-panel">
      <div className="exam-row" style={{ justifyContent: 'space-between' }}>
        <div className="exam-row">
          {!active ? (
            <button type="button" className="exam-btn primary" onClick={() => { void startCamera(); }}>
              <Camera size={16} /> เปิดกล้องสแกนสด (ZipGrade Mode)
            </button>
          ) : (
            <>
              <button type="button" className="exam-btn danger" onClick={stopCamera}>
                <CameraOff size={16} /> ปิดกล้อง
              </button>
              <button type="button" className="exam-btn primary" onClick={handleManualSnap}>
                <Sparkles size={16} /> จับภาพตอนนี้
              </button>
              <button type="button" className="exam-btn" onClick={toggleFacing} title="สลับกล้องหน้า/หลัง">
                <RefreshCw size={15} /> สลับกล้อง
              </button>
            </>
          )}
        </div>
        <div className="exam-row">
          <label className="exam-toggle" title="เมื่อสแกนชัดครบทุกข้อและอ่านเลขที่ได้ จะบันทึกผลทันทีโดยไม่ต้องกดปุ่ม">
            <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
            <span>บันทึกอัตโนมัติเมื่ออ่านชัด</span>
          </label>
          <button
            type="button"
            className="exam-btn"
            onClick={() => setSoundOn((v) => !v)}
            aria-label={soundOn ? 'ปิดเสียงติ๊ด' : 'เปิดเสียงติ๊ด'}
            title={soundOn ? 'เปิดเสียงติ๊ดเมื่อสแกนติด' : 'ปิดเสียง'}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {scannedCount > 0 && (
            <span className="exam-pill good">
              <CheckCircle2 size={14} style={{ marginRight: 4 }} /> สแกนแล้ว {scannedCount} แผ่น
            </span>
          )}
        </div>
      </div>

      {cameraError && <div className="exam-error">{cameraError}</div>}

      {active && (
        <div className="exam-live-wrap">
          <div className="exam-live">
            <video ref={videoRef} playsInline muted autoPlay />
            <canvas ref={overlayRef} aria-label="กรอบเล็งกระดาษคำตอบสด" />
            {flashBanner && <div className="exam-live-flash" role="status">{flashBanner}</div>}
          </div>
          <div className="exam-live-status" aria-live="polite">{statusText}</div>
        </div>
      )}
    </div>
  );
};

export default LiveOmrCameraScanner;
