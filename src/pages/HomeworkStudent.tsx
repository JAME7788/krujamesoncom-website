import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Sparkles,
  ExternalLink,
  ClipboardList,
  Camera,
  Monitor,
  PenTool,
  FolderUp,
  Trash2,
  Link2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAssignmentsForStudent,
  submitWork,
  getStudentSubmissionForAssignment,
  getStudentWorkStatusOverview,
  fetchAssignmentsFromFirebase,
  fetchSubmissionsFromFirebase,
  recommendAssignment,
  validateSubmissionContent,
  prepareDirectStudentSubmissionFile,
  ensureAssignmentForManualAssessment,
  isDirectPortalSubmissionUrl,
  loadGoogleDriveBridgeConfig,
  type Assignment,
  type MissingManualAssessmentItem,
  type SubmissionMethod,
} from '../services/homeworkService';
import { isScoreEligibleUser } from '../services/userAccessService';

type HomeworkFilterTab =
  | 'all'
  | 'missing'
  | 'overdue'
  | 'waiting_review'
  | 'graded'
  | 'recommended'
  | 'foundation'
  | 'standard'
  | 'advanced'
  | 'submitted';

type StudentSubmitModeTab = 'direct_file' | 'canvas_draw' | 'workstation' | 'link_text';

const WORKSTATION_OPTIONS = [
  ...Array.from({ length: 30 }, (_, idx) => `เครื่องที่ ${String(idx + 1).padStart(2, '0')}`),
  'ส่งสมุด/ใบงานกระดาษที่โต๊ะครู',
];

const HomeworkStudent: React.FC = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [contentUrl, setContentUrl] = useState('');
  const [comment, setComment] = useState('');
  const [contentData, setContentData] = useState('');
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [uploadedToDrive, setUploadedToDrive] = useState(false);
  const [attachmentFileName, setAttachmentFileName] = useState('');
  const [attachmentMimeType, setAttachmentMimeType] = useState('');
  const [workstationNo, setWorkstationNo] = useState('');
  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>('screenshot_file');
  const [submitModeTab, setSubmitModeTab] = useState<StudentSubmitModeTab>('direct_file');
  const [processingFile, setProcessingFile] = useState(false);

  // Drawing Canvas State
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasCanvasStrokes, setHasCanvasStrokes] = useState(false);
  const [penColor, setPenColor] = useState('#1e3a8a');
  const [penSize, setPenSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [usingCachedAssignments, setUsingCachedAssignments] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [filter, setFilter] = useState<HomeworkFilterTab>('all');
  const openedFromUrlRef = useRef(false);

  const [dtDefine, setDtDefine] = useState('');
  const [dtIdeate, setDtIdeate] = useState('');
  const [dtPrototypeUrl, setDtPrototypeUrl] = useState('');
  const [dtTestFeedback, setDtTestFeedback] = useState('');

  const [packChoices, setPackChoices] = useState<Record<string, string>>({});

  const initDrawingCanvas = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw subtle grid lines for flowchart / worksheet convenience
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    setHasCanvasStrokes(false);
  }, []);

  const openSubmission = useCallback((assignment: Assignment) => {
    const previous = user
      ? getStudentSubmissionForAssignment(assignment.id, user.id, user.classroom, parseInt(user.studentNumber))
      : null;
    const prevUrl = previous?.contentUrl || '';
    const isDriveOrCloud = Boolean(prevUrl && /drive\.google\.com|firebasestorage\.googleapis\.com/i.test(prevUrl));
    setContentUrl(isDirectPortalSubmissionUrl(prevUrl) ? '' : prevUrl);
    setComment(previous?.comment || '');
    setContentData(previous?.contentData || '');
    setLocalPreviewUrl(previous?.contentData || '');
    setUploadedToDrive(isDriveOrCloud);
    setAttachmentFileName(previous?.attachmentFileName || '');
    setAttachmentMimeType(previous?.attachmentMimeType || '');
    setWorkstationNo(previous?.workstationNo || '');
    const prevMethod = previous?.submissionMethod || 'screenshot_file';
    setSubmissionMethod(prevMethod);
    if (previous?.workstationNo) {
      setSubmitModeTab('workstation');
    } else if (previous?.submissionMethod === 'canvas_drawing') {
      setSubmitModeTab('canvas_draw');
    } else if (prevUrl && !isDirectPortalSubmissionUrl(prevUrl) && !previous?.contentData && !previous?.attachmentFileName) {
      setSubmitModeTab('link_text');
    } else {
      setSubmitModeTab('direct_file');
    }
    setDtDefine(previous?.designThinkingSteps?.define || '');
    setDtIdeate(previous?.designThinkingSteps?.ideate || '');
    setDtPrototypeUrl(previous?.designThinkingSteps?.prototypeUrl || prevUrl);
    setDtTestFeedback(previous?.designThinkingSteps?.testFeedback || '');
    setHasCanvasStrokes(false);
    setSelected(assignment);
  }, [user]);

  const closeSubmission = () => {
    setSelected(null);
    setContentUrl('');
    setComment('');
    setContentData('');
    setLocalPreviewUrl('');
    setUploadedToDrive(false);
    setAttachmentFileName('');
    setAttachmentMimeType('');
    setWorkstationNo('');
    setHasCanvasStrokes(false);
    setDtDefine('');
    setDtIdeate('');
    setDtPrototypeUrl('');
    setDtTestFeedback('');
  };

  useEffect(() => {
    if (selected && submitModeTab === 'canvas_draw') {
      const timer = window.setTimeout(() => initDrawingCanvas(), 30);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [selected, submitModeTab, initDrawingCanvas]);

  useEffect(() => {
    if (!isScoreEligibleUser(user)) return;
    let cancelled = false;
    const fallback = window.setTimeout(() => {
      if (cancelled) return;
      setAssignments(getAssignmentsForStudent(user.classroom, user.id, parseInt(user.studentNumber)));
      setDataVersion((version) => version + 1);
      setUsingCachedAssignments(true);
      setLoadingAssignments(false);
    }, 5000);
    Promise.all([fetchAssignmentsFromFirebase(), fetchSubmissionsFromFirebase()])
      .then(() => {
        if (!cancelled) {
          setAssignments(getAssignmentsForStudent(user.classroom, user.id, parseInt(user.studentNumber)));
          setDataVersion((version) => version + 1);
          setUsingCachedAssignments(false);
        }
      })
      .catch((error) => {
        console.warn('load homework failed, using local cache', error);
        if (!cancelled) {
          setAssignments(getAssignmentsForStudent(user.classroom, user.id, parseInt(user.studentNumber)));
          setUsingCachedAssignments(true);
        }
      })
      .finally(() => {
        window.clearTimeout(fallback);
        if (!cancelled) setLoadingAssignments(false);
      });
    return () => { cancelled = true; window.clearTimeout(fallback); };
  }, [user]);

  useEffect(() => {
    if (openedFromUrlRef.current || !assignments.length) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id') || params.get('assignmentId');
    const urlFilter = params.get('filter') as HomeworkFilterTab | null;
    if (urlFilter) {
      setFilter(urlFilter);
    }
    if (targetId) {
      const match = assignments.find((a) => a.id === targetId);
      if (match) {
        openedFromUrlRef.current = true;
        const timer = window.setTimeout(() => openSubmission(match), 0);
        return () => window.clearTimeout(timer);
      }
    }
    return undefined;
  }, [assignments, openSubmission]);

  const workOverview = useMemo(() => {
    void dataVersion;
    if (!user) return null;
    return getStudentWorkStatusOverview(
      user.classroom,
      user.id,
      parseInt(user.studentNumber),
      user.name,
      packChoices,
    );
  }, [user, packChoices, dataVersion]);

  const filteredTasks = useMemo(() => {
    if (!workOverview || !user) return [];
    return workOverview.tasks.filter((item) => {
      const a = item.assignment;
      const sub = item.submission;
      const recommendedDiff = recommendAssignment(a, user.id).difficulty;
      if (filter === 'missing') return !sub;
      if (filter === 'overdue') return item.status === 'overdue';
      if (filter === 'waiting_review') return item.status === 'waiting_review';
      if (filter === 'graded') return item.status === 'graded';
      if (filter === 'submitted') return Boolean(sub);
      if (filter === 'recommended') return (a.difficulty || 'standard') === recommendedDiff;
      if (filter === 'foundation') return a.difficulty === 'foundation';
      if (filter === 'standard') return !a.difficulty || a.difficulty === 'standard';
      if (filter === 'advanced') return a.difficulty === 'advanced';
      return true;
    });
  }, [workOverview, user, filter]);

  if (!user) {
    return (
      <div className="container section-padding" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <h2>กรุณา Login ก่อน</h2>
      </div>
    );
  }

  if (!isScoreEligibleUser(user)) {
    return (
      <div className="container section-padding" style={{ paddingTop: '7rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 620, margin: '0 auto', padding: '2rem' }}>
          <AlertCircle size={44} color="#f59e0b" />
          <h2>การบ้านสำหรับนักเรียนในโรงเรียน</h2>
          <p>บัญชีครูและผู้ทดลองภายนอกไม่สามารถส่งงาน และระบบจะไม่สร้างคะแนนจากหน้านี้</p>
        </div>
      </div>
    );
  }

  /** แนบไฟล์หรือภาพแคปหน้าจอ -> ส่งเข้า Google Drive กลางของครูโดยตรง (เก็บเฉพาะลิงก์ ไม่เปลืองความจำเว็บ!) */
  const handleDirectFileAttach = async (file: File | Blob, customFileName?: string, method: SubmissionMethod = 'screenshot_file') => {
    if (!selected) return;
    setProcessingFile(true);
    try {
      if (file.type.startsWith('image/')) {
        try {
          setLocalPreviewUrl(URL.createObjectURL(file));
        } catch {
          // ignore
        }
      }
      const prepared = await prepareDirectStudentSubmissionFile(file, {
        studentId: user.id,
        studentName: user.name,
        studentNo: parseInt(user.studentNumber),
        classroom: user.classroom,
        assignmentId: selected.id,
        assignmentTitle: selected.title,
        fileName: customFileName,
      });
      setContentData(prepared.contentData);
      if (prepared.contentData && !localPreviewUrl) {
        setLocalPreviewUrl(prepared.contentData);
      }
      setUploadedToDrive(prepared.uploadedToDrive);
      if (prepared.uploadedToDrive && prepared.contentUrl) {
        setContentUrl(prepared.contentUrl);
      }
      setAttachmentFileName(prepared.attachmentFileName);
      setAttachmentMimeType(prepared.attachmentMimeType);
      setSubmissionMethod(method);
      if (selected.isDesignThinking && !dtPrototypeUrl.trim()) {
        setDtPrototypeUrl(prepared.contentUrl);
      }
      if (!comment.trim()) {
        setComment(
          prepared.uploadedToDrive
            ? `อัปโหลดไฟล์เข้า Google Drive กลางของครูเรียบร้อยแล้ว (${prepared.attachmentFileName})`
            : method === 'canvas_drawing'
            ? `วาดภาพ/เขียนผังงานในระบบ (${prepared.attachmentFileName})`
            : `ส่งไฟล์ผลงาน/ภาพแคปหน้าจอจากเครื่องคอมพิวเตอร์ (${prepared.attachmentFileName})`,
        );
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'ไม่สามารถแนบไฟล์นี้ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setProcessingFile(false);
    }
  };

  /** ปุ่มแคปหน้าจอโปรแกรมที่เปิดอยู่บนคอมพิวเตอร์โรงเรียนใน 1 คลิก */
  const handleOneClickScreenCapture = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('เบราว์เซอร์นี้ไม่รองรับการแคปหน้าจออัตโนมัติ กรุณากดปุ่ม PrtSc บนคีย์บอร์ดแล้วกด Ctrl + V เพื่อวางภาพ หรือกดปุ่ม "เลือกไฟล์จากคอมพิวเตอร์" ครับ');
      return;
    }
    try {
      setProcessingFile(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as MediaTrackConstraints,
        audio: false,
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      // รอ 150ms ให้ภาพหน้าจอเรนเดอร์ครบ
      await new Promise((r) => setTimeout(r, 150));
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      stream.getTracks().forEach((track) => track.stop());
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.82),
      );
      if (blob) {
        await handleDirectFileAttach(blob, `แคปหน้าจอ_${selected?.title || 'งาน'}_${Date.now()}.jpg`, 'screenshot_file');
      }
    } catch (err: unknown) {
      console.warn('Screen capture cancelled or failed:', err);
    } finally {
      setProcessingFile(false);
    }
  };

  /** รองรับการกด Ctrl + V วางภาพหน้าจอที่แคปมาลงในกล่องส่งงานทันที */
  const handleModalPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          await handleDirectFileAttach(blob, `ภาพวางจากคลิปบอร์ด_${Date.now()}.png`, 'screenshot_file');
        }
        return;
      }
    }
  };

  /** วาดเส้นลงบนกระดาน Canvas */
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return {
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    setHasCanvasStrokes(true);
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : penColor;
    ctx.lineWidth = isEraser ? penSize * 4 : penSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const saveCanvasToAttachment = async (): Promise<{ dataUrl: string; contentUrl?: string; fileName: string } | null> => {
    const canvas = drawCanvasRef.current;
    if (!canvas || !selected) return null;
    const fileName = `กระดานวาดภาพ_${selected.title || 'ใบงาน'}.jpg`;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.65),
    );
    if (blob) {
      const prepared = await prepareDirectStudentSubmissionFile(blob, {
        studentId: user.id,
        studentName: user.name,
        studentNo: parseInt(user.studentNumber),
        classroom: user.classroom,
        assignmentId: selected.id,
        assignmentTitle: selected.title,
        fileName,
      });
      setContentData(prepared.contentData);
      setLocalPreviewUrl(canvas.toDataURL('image/jpeg', 0.65));
      setUploadedToDrive(prepared.uploadedToDrive);
      if (prepared.uploadedToDrive && prepared.contentUrl) {
        setContentUrl(prepared.contentUrl);
      }
      setAttachmentFileName(fileName);
      setAttachmentMimeType('image/jpeg');
      setSubmissionMethod('canvas_drawing');
      if (!comment.trim()) {
        setComment(`วาดภาพ/เขียนผังงานส่งในระบบ (${fileName})`);
      }
      return { dataUrl: prepared.contentData, contentUrl: prepared.contentUrl, fileName };
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.55);
    setContentData(dataUrl);
    setLocalPreviewUrl(dataUrl);
    setAttachmentFileName(fileName);
    setAttachmentMimeType('image/jpeg');
    setSubmissionMethod('canvas_drawing');
    if (!comment.trim()) {
      setComment(`วาดภาพ/เขียนผังงานส่งในระบบ (${fileName})`);
    }
    return { dataUrl, fileName };
  };

  const handleOpenManualAssessmentSubmission = async (ma: MissingManualAssessmentItem) => {
    try {
      setSyncing(true);
      const linkedAssign = await ensureAssignmentForManualAssessment(user.classroom, ma);
      setAssignments(getAssignmentsForStudent(user.classroom, user.id, parseInt(user.studentNumber)));
      setDataVersion((v) => v + 1);
      openSubmission(linkedAssign);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'ไม่สามารถเปิดหน้าส่งใบงานได้');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async () => {
    if (!selected) return;

    let finalContentData = contentData;
    let finalUrl = contentUrl.trim();
    let finalFileName = attachmentFileName;
    let finalMimeType = attachmentMimeType;
    let finalMethod: SubmissionMethod = submissionMethod;

    // หากนักเรียนวาดภาพบนกระดานไว้แล้วกด "ส่งงาน" ทันที ให้บันทึกภาพจากกระดานอัตโนมัติ
    if (submitModeTab === 'canvas_draw' && hasCanvasStrokes && !finalContentData && !finalUrl) {
      const savedCanvas = await saveCanvasToAttachment();
      if (savedCanvas) {
        finalContentData = savedCanvas.dataUrl;
        if (savedCanvas.contentUrl && !isDirectPortalSubmissionUrl(savedCanvas.contentUrl)) {
          finalUrl = savedCanvas.contentUrl;
        }
        finalFileName = savedCanvas.fileName;
        finalMimeType = 'image/jpeg';
        finalMethod = 'canvas_drawing';
      }
    }

    const finalWorkstation = workstationNo.trim();
    let finalComment = comment.trim();
    let dtSteps = undefined;

    if (finalWorkstation && !finalComment) {
      finalComment = `ทำเสร็จที่ ${finalWorkstation} เรียบร้อยแล้วครับ/ค่ะ`;
    }

    if (selected.isDesignThinking) {
      const proto = dtPrototypeUrl.trim();
      dtSteps = {
        define: dtDefine.trim(),
        ideate: dtIdeate.trim(),
        prototypeUrl: proto,
        testFeedback: dtTestFeedback.trim(),
      };
      if (!finalComment) {
        finalComment = `[Design Thinking]\n1. ปัญหา: ${dtDefine.trim()}\n2. ไอเดีย: ${dtIdeate.trim()}\n3. ผลทดสอบ: ${dtTestFeedback.trim()}`;
      }
    }

    const validation = validateSubmissionContent({
      contentUrl: finalUrl,
      contentData: finalContentData,
      workstationNo: finalWorkstation,
      submissionMethod: finalMethod,
      comment: finalComment,
      isDesignThinking: selected.isDesignThinking,
      dtDefine,
      dtIdeate,
      dtPrototypeUrl,
    });

    if (!validation.valid) {
      alert(validation.error || 'ข้อมูลการส่งงานไม่ถูกต้อง');
      return;
    }

    setSyncing(true);
    try {
      await submitWork({
        assignmentId: selected.id,
        studentId: user.id,
        studentName: user.name,
        classroom: user.classroom,
        studentNo: parseInt(user.studentNumber),
        contentUrl: finalUrl,
        contentData: finalContentData || undefined,
        attachmentFileName: finalFileName || undefined,
        attachmentMimeType: finalMimeType || undefined,
        workstationNo: finalWorkstation || undefined,
        submissionMethod: finalMethod,
        comment: finalComment,
        designThinkingSteps: dtSteps,
      });

      setDataVersion((version) => version + 1);
      alert('ส่งงานสำเร็จเรียบร้อยแล้ว! 📋 ชิ้นงานถูกส่งให้คุณครูแล้ว อยู่ในสถานะ "รอคุณครูตรวจและให้คะแนน" ครับ');
      closeSubmission();
    } catch (error: unknown) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'ส่งงานไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่');
    } finally {
      setSyncing(false);
    }
  };

  const overview = workOverview || {
    tasks: [],
    missingTasks: [],
    overdueTasks: [],
    pendingTasks: [],
    waitingReviewTasks: [],
    gradedTasks: [],
    missingManualAssessments: [],
    totalRequiredCount: 0,
    completedCount: 0,
    totalMissingCount: 0,
    overdueCount: 0,
    pendingCount: 0,
    waitingReviewCount: 0,
    gradedCount: 0,
    completionPercent: 100,
  };

  return (
    <div className="container section-padding" style={{ paddingTop: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px' }}>📝 ศูนย์ส่งงานและเช็กงานค้างของฉัน</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {user.name} (ชั้น {user.classroom} เลขที่ {user.studentNumber}) • ตรวจสอบงานค้าง ส่งการบ้าน และติดตามผลคะแนน K/P
          </p>
        </div>
        <div style={{ padding: '6px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: '0.82rem', color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} /> เลือกหนึ่งทางต่อชุดงาน • ใช้คำใบ้ได้โดยไม่หักคะแนน
        </div>
      </div>

      {usingCachedAssignments && (
        <p role="status" style={{ color: '#92400e', background: '#fef3c7', padding: '8px 12px', borderRadius: 8, marginTop: 12 }}>
          กำลังแสดงรายการที่บันทึกไว้ในเครื่อง ข้อมูลออนไลน์อาจยังไม่ล่าสุด
        </p>
      )}

      {/* 📊 แผงสรุปสถานะงานค้างและการส่งงานของฉัน */}
      <div
        className="card"
        style={{
          marginTop: '1.25rem',
          padding: '1.25rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1.5px solid #e2e8f0',
          borderRadius: 18,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={20} color="#4f46e5" />
            <strong style={{ fontSize: '1.02rem', color: '#0f172a' }}>
              สรุปสถานะการส่งงานของฉัน (ส่งแล้ว {overview.completedCount} / {overview.tasks.length} ชิ้น)
            </strong>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.8rem',
              fontWeight: 800,
              background: overview.totalMissingCount === 0 ? '#dcfce7' : overview.overdueCount > 0 ? '#fee2e2' : '#fef3c7',
              color: overview.totalMissingCount === 0 ? '#166534' : overview.overdueCount > 0 ? '#b91c1c' : '#92400e',
            }}
          >
            {overview.totalMissingCount === 0
              ? '🎉 ส่งงานครบทุกชิ้นแล้ว!'
              : `📌 มีงานค้างที่ต้องติดตามรวม ${overview.totalMissingCount} รายการ`}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ height: 10, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
          <div
            style={{
              width: `${overview.completionPercent}%`,
              height: '100%',
              background: overview.completionPercent === 100
                ? 'linear-gradient(90deg, #10b981, #22c55e)'
                : 'linear-gradient(90deg, #6366f1, #38bdf8)',
              transition: 'width 0.35s ease',
            }}
          />
        </div>

        {/* 4 Clickable Status Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 10 }}>
          <button
            type="button"
            onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              borderRadius: 12,
              border: filter === 'overdue' ? '2px solid #ef4444' : '1px solid #fecaca',
              background: '#fef2f2',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: '#b91c1c', fontWeight: 700 }}>🚨 ค้างส่ง (เลยกำหนด)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#dc2626', marginTop: 2 }}>
              {overview.overdueCount} <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>ชิ้น</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFilter(filter === 'missing' ? 'all' : 'missing')}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              borderRadius: 12,
              border: filter === 'missing' ? '2px solid #f59e0b' : '1px solid #fde68a',
              background: '#fffbeb',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 700 }}>📌 งานค้างรอส่งทั้งหมด</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#d97706', marginTop: 2 }}>
              {overview.overdueCount + overview.pendingCount}{' '}
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>ชิ้น</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFilter(filter === 'waiting_review' ? 'all' : 'waiting_review')}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              borderRadius: 12,
              border: filter === 'waiting_review' ? '2px solid #0284c7' : '1px solid #bae6fd',
              background: '#f0f9ff',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 700 }}>⏳ ส่งแล้ว (รอครูตรวจ)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7', marginTop: 2 }}>
              {overview.waitingReviewCount} <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>ชิ้น</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFilter(filter === 'graded' ? 'all' : 'graded')}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              borderRadius: 12,
              border: filter === 'graded' ? '2px solid #16a34a' : '1px solid #bbf7d0',
              background: '#f0fdf4',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700 }}>✅ ตรวจและได้คะแนนแล้ว</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#16a34a', marginTop: 2 }}>
              {overview.gradedCount} <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>ชิ้น</span>
            </div>
          </button>
        </div>

        {/* 🚨 กล่องแจ้งเตือนรายการงานค้าง (ทั้งการบ้านออนไลน์ และ ใบงานในสมุดคะแนน) */}
        {(overview.missingTasks.length > 0 || overview.missingManualAssessments.length > 0) && (
          <div
            style={{
              marginTop: 14,
              padding: '12px 14px',
              borderRadius: 12,
              background: overview.overdueCount > 0 ? '#fff1f2' : '#fffbeb',
              border: overview.overdueCount > 0 ? '1.5px solid #fda4af' : '1.5px solid #fcd34d',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: overview.overdueCount > 0 ? '#9f1239' : '#92400e', marginBottom: 8 }}>
              📋 รายการงานที่เธอยังค้างอยู่ ({overview.totalMissingCount} รายการ) — กดปุ่ม &ldquo;ส่งงานนี้เลย&rdquo; เพื่อทำและส่งได้ทันที:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overview.missingTasks.map((item) => (
                <div
                  key={item.assignment.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: '#ffffff',
                    border: item.isOverdue ? '1px solid #fca5a5' : '1px solid #fde68a',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: item.isOverdue ? '#ef4444' : '#f59e0b',
                        color: '#ffffff',
                      }}
                    >
                      {item.isOverdue ? '🚨 เลยกำหนด' : '📌 ยังไม่ส่ง'}
                    </span>
                    <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{item.assignment.title}</strong>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      ({item.subjectTitle}{item.indicatorCode ? ` • ${item.indicatorCode}` : ''} • {item.dueLabel})
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => openSubmission(item.assignment)}
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    <Upload size={13} /> ส่งงานนี้เลย
                  </button>
                </div>
              ))}

              {overview.missingManualAssessments.map((ma) => (
                <div
                  key={ma.assessmentId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: '#ffffff',
                    border: '1px dashed #fbbf24',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #f59e0b',
                      }}
                    >
                      📝 ใบงานในชั้นเรียน
                    </span>
                    <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{ma.title}</strong>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      (วิชา{ma.subjectTitle} • {ma.indicatorCode} • คะแนนเต็ม {ma.maxScore} คะแนน — ยังไม่มีคะแนนในสมุด ปพ.5)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {ma.resourceUrl && (
                      <a
                        href={ma.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                      >
                        <ExternalLink size={13} /> เปิดใบงาน
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={syncing}
                      onClick={() => void handleOpenManualAssessmentSubmission(ma)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        background: 'linear-gradient(135deg, #0ea5e9, #4f46e5)',
                      }}
                    >
                      <Camera size={13} /> ส่งใบงานนี้ผ่านเว็บ (ไม่ต้องใช้ Gmail)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '1.25rem 0' }}>
        {[
          { id: 'all', label: `งานทั้งหมด (${overview.tasks.length})` },
          { id: 'missing', label: `📌 งานค้างยังไม่ส่ง (${overview.overdueCount + overview.pendingCount})` },
          { id: 'overdue', label: `🚨 เลยกำหนด (${overview.overdueCount})` },
          { id: 'waiting_review', label: `⏳ รอครูตรวจ (${overview.waitingReviewCount})` },
          { id: 'graded', label: `✅ ตรวจแล้ว (${overview.gradedCount})` },
          { id: 'recommended', label: '✨ แนะนำสำหรับเธอ' },
          { id: 'foundation', label: '🟢 พื้นฐาน' },
          { id: 'standard', label: '🟡 มาตรฐาน' },
          { id: 'advanced', label: '🔵 ท้าทาย' },
          { id: 'submitted', label: '✓ ส่งแล้วทั้งหมด' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as HomeworkFilterTab)}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: filter === tab.id ? 700 : 500,
              border: filter === tab.id ? '2px solid var(--primary, #6366f1)' : '1px solid #d1d5db',
              background: filter === tab.id ? '#e0e7ff' : '#f9fafb',
              color: filter === tab.id ? '#3730a3' : '#374151',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loadingAssignments && assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>กำลังดึงงานจากฐานข้อมูล...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} color="#9ca3af" />
          <h3>ไม่พบรายการในหมวดนี้ 🎉</h3>
          <p>ไม่มีงานต้องส่งในหมวดที่เลือก — ลองเลือกแท็บ &ldquo;งานทั้งหมด&rdquo;</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredTasks.map((item) => {
            const a = item.assignment;
            const sub = item.submission;
            const overdue = item.isOverdue;
            const recommendation = recommendAssignment(a, user.id);
            const isRecommended = (a.difficulty || 'standard') === recommendation.difficulty;
            return (
              <div key={a.id} className="card" style={{
                borderLeft: overdue ? '4px solid #ef4444' : sub ? '4px solid #22c55e' : isRecommended ? '4px solid #f59e0b' : '4px solid #cbd5e1',
                background: isRecommended && !sub ? 'linear-gradient(to right, #fffdf5, #ffffff)' : 'white',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h3 style={{ margin: 0 }}>{a.title}</h3>
                      {a.difficulty === 'foundation' ? (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                          🟢 พื้นฐาน (มีคำใบ้)
                        </span>
                      ) : a.difficulty === 'advanced' ? (
                        <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                          🔵 ท้าทาย {a.bonusPoints ? `+${a.bonusPoints} XP` : ''}
                        </span>
                      ) : (
                        <span style={{ background: '#fef3c7', color: '#854d0e', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                          🟡 มาตรฐาน
                        </span>
                      )}
                      {isRecommended && (
                        <span style={{ background: 'linear-gradient(135deg, #fef08a, #fde047)', color: '#713f12', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Sparkles size={11} /> แนะนำสำหรับเธอ
                        </span>
                      )}
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                        📚 {item.subjectTitle}{item.indicatorCode ? ` (${item.indicatorCode})` : ''}
                      </span>
                    </div>
                    {a.recommendedReason && (
                      <div style={{ fontSize: '0.8rem', color: '#4b5563', margin: '4px 0 6px', background: '#f8fafc', borderLeft: '3px solid #6366f1', padding: '3px 8px', borderRadius: 4 }}>
                        💡 {recommendation.reason}
                      </div>
                    )}
                    {a.personalizedPackId && !sub && <label style={{ display: 'block', margin: '10px 0' }}>
                      ทางเลือกของงานนี้{' '}
                      <select aria-label={`ทางเลือก ${a.title}`} value={a.id} onChange={e => setPackChoices(prev => ({ ...prev, [a.personalizedPackId!]: e.target.value }))}>
                        {assignments.filter(v => v.personalizedPackId === a.personalizedPackId).map(v => <option key={v.id} value={v.id}>{v.difficulty === 'foundation' ? 'ฝึกพร้อมตัวช่วย' : v.difficulty === 'advanced' ? 'โจทย์ท้าทาย' : 'ฝึกด้วยตนเอง'}</option>)}
                      </select>
                    </label>}
                    <p style={{ color: '#6b7280', margin: '0 0 8px', fontSize: '0.88rem' }}>{a.description}</p>
                    {a.hints && a.hints.length > 0 && (
                      <details style={{ margin: '6px 0 8px', fontSize: '0.82rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 10px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#1d4ed8' }}>
                          💡 ดูคำใบ้ช่วยคิด ({a.hints.length} ข้อ)
                        </summary>
                        <ul style={{ margin: '6px 0 0 16px', padding: 0, color: '#1e40af' }}>
                          {a.hints.map((h, i) => <li key={i} style={{ marginBottom: 2 }}>{h}</li>)}
                        </ul>
                      </details>
                    )}
                    {a.resourceUrl && (
                      <a href={a.resourceUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', marginBottom: 8, fontSize: '0.85rem' }}>
                        เปิดใบงาน/คำสั่งงาน ↗
                      </a>
                    )}
                    <div style={{ fontSize: '0.85rem', color: overdue ? '#dc2626' : '#6b7280', fontWeight: overdue ? 700 : 500, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span><Clock size={14} style={{ verticalAlign: 'middle' }} /> {item.dueLabel}</span>
                      <span>K {a.knowledgeMaxScore ?? (a.category === 'k' ? a.maxScore : 0)}</span>
                      <span>P {a.practiceMaxScore ?? (a.category === 'p' ? a.maxScore : 0)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {sub ? (
                      <div>
                        <div style={{ color: '#22c55e', fontWeight: 700 }}>
                          <CheckCircle2 size={16} style={{ verticalAlign: 'middle' }} /> ส่งแล้ว
                        </div>
                        {sub.attachmentFileName && (
                          <div style={{ fontSize: '0.74rem', color: '#0369a1', marginTop: 2 }}>
                            📸 {sub.attachmentFileName}
                          </div>
                        )}
                        {sub.workstationNo && (
                          <div style={{ fontSize: '0.74rem', color: '#4f46e5', marginTop: 2 }}>
                            🖥️ {sub.workstationNo}
                          </div>
                        )}
                        {sub.score !== undefined ? (
                          <div style={{ marginTop: 4, padding: '4px 12px', background: '#dcfce7', borderRadius: 999, fontSize: '0.85rem' }}>
                            ได้ {sub.score}/{a.maxScore} (K {sub.kScore ?? '-'} / P {sub.pScore ?? '-'})
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>รอครูตรวจ</div>
                        )}
                        {sub.reviewedAt === undefined && <button className="btn-secondary" onClick={() => openSubmission(a)}>แก้ไขการส่งงาน</button>}
                        {sub.feedback && (
                          <div style={{ marginTop: 8, padding: 8, background: '#fef3c7', borderRadius: 8, fontSize: '0.82rem' }}>
                            💬 {sub.feedback}
                          </div>
                        )}
                      </div>
                    ) : overdue ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.82rem' }}>
                          <AlertCircle size={15} style={{ verticalAlign: 'middle' }} /> ค้างส่ง (เลยกำหนด)
                        </div>
                        <button onClick={() => openSubmission(a)} className="btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}>
                          <Upload size={14} /> ส่งงานย้อนหลัง
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => openSubmission(a)} className="btn-primary">
                        <Upload size={14} /> ส่งงาน
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit modal (5-in-1 No-Gmail / No-Phone Direct Classroom Submission System) */}
      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto',
          }}
          onClick={() => {
            if (!syncing) closeSubmission();
          }}
        >
          <div
            className="card"
            onPaste={(e) => void handleModalPaste(e)}
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '92vh',
              overflowY: 'auto',
              background: 'white',
              padding: '1.35rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{selected.title}</h2>
              {selected.difficulty === 'foundation' ? (
                <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                  🟢 พื้นฐาน
                </span>
              ) : selected.difficulty === 'advanced' ? (
                <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                  🔵 ท้าทาย
                </span>
              ) : null}
            </div>
            {selected.recommendedReason && (
              <div style={{ fontSize: '0.8rem', color: '#4b5563', margin: '0 0 8px', background: '#f8fafc', padding: '4px 8px', borderRadius: 4 }}>
                💡 {selected.recommendedReason}
              </div>
            )}
            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 10px' }}>{selected.description}</p>

            {/* ป้ายแนะนำระบบส่งงานไร้ Gmail / ไม่ต้องใช้โทรศัพท์ */}
            <div
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #ecfeff 0%, #f0fdf4 100%)',
                border: '1px solid #67e8f9',
                borderRadius: 10,
                fontSize: '0.79rem',
                color: '#0f766e',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Sparkles size={16} color="#0284c7" style={{ flexShrink: 0 }} />
              <div>
                <strong>ส่งงานได้ทันทีโดยไม่ต้องมี Gmail และไม่ต้องใช้โทรศัพท์มือถือ!</strong> เลือกแคปหน้าจอโปรแกรม แนบไฟล์จากเครื่องคอมฯ วาดผังงาน หรือแจ้งหมายเลขเครื่องคอมพิวเตอร์ได้เลยครับ
              </div>
            </div>

            {selected.hints && selected.hints.length > 0 && (
              <div style={{ margin: '10px 0', padding: '8px 12px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                <strong style={{ fontSize: '0.82rem', color: '#1d4ed8' }}>💡 คำใบ้และแนวทางช่วยเหลือ:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '0.8rem', color: '#1e40af' }}>
                  {selected.hints.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </div>
            )}

            {selected.isDesignThinking ? (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '8px 12px', background: '#f0fdfa', borderRadius: 8, border: '1px solid #99f6e4', color: '#0f766e', fontSize: '0.82rem', fontWeight: 700 }}>
                  💡 บันทึกกระบวนการคิดเชิงออกแบบ (Design Thinking: ว 4.1)
                </div>
                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f766e' }}>🎯 ขั้นที่ 1: ปัญหาที่พบและกลุ่มผู้ใช้ (Define & Empathize)</label>
                  <textarea
                    value={dtDefine}
                    onChange={(e) => setDtDefine(e.target.value)}
                    rows={2}
                    placeholder="ปัญหาที่ต้องการแก้ไขคืออะไร? ใครได้รับผลกระทบ?"
                    style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f766e' }}>🧠 ขั้นที่ 2: ไอเดียแนวทางแก้ปัญหา (Ideate)</label>
                  <textarea
                    value={dtIdeate}
                    onChange={(e) => setDtIdeate(e.target.value)}
                    rows={2}
                    placeholder="คิดแนวทางแก้ปัญหาอย่างไรบ้าง? ทำไมจึงเลือกวิธีนี้?"
                    style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f766e' }}>🛠️ ขั้นที่ 3: ชิ้นงานต้นแบบ (แคปหน้าจอแนบไฟล์โดยไม่ต้องใช้ Gmail หรือวางลิงก์)</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={processingFile}
                      onClick={() => void handleOneClickScreenCapture()}
                      style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#0284c7' }}
                    >
                      <Camera size={14} /> แคปหน้าจอโปรแกรมต้นแบบ (1 คลิก)
                    </button>
                    <label
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <FolderUp size={14} /> เลือกไฟล์/รูปภาพต้นแบบ
                      <input
                        type="file"
                        accept="image/*,.sb3,.py,.html,.pdf,.docx,.pptx,.txt"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleDirectFileAttach(f, f.name, 'screenshot_file');
                        }}
                      />
                    </label>
                  </div>
                  <input
                    value={dtPrototypeUrl}
                    onChange={(e) => setDtPrototypeUrl(e.target.value)}
                    placeholder="https://canva.com/... หรือ https://scratch.mit.edu/... (ถ้าแนบไฟล์ระบบจะสร้างลิงก์ให้อัตโนมัติ)"
                    style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 6, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f766e' }}>🧪 ขั้นที่ 4: ผลการทดสอบและข้อคิดเห็น (Test & Feedback)</label>
                  <textarea
                    value={dtTestFeedback}
                    onChange={(e) => setDtTestFeedback(e.target.value)}
                    rows={2}
                    placeholder="เมื่อทดสอบกับเพื่อน/ครู ผลเป็นอย่างไร? มีจุดที่ต้องปรับปรุงตรงไหน?"
                    style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* 4 โหมดส่งงานสำหรับนักเรียนที่ไม่มี Gmail / ไม่มีโทรศัพท์ */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  {[
                    {
                      id: 'direct_file' as const,
                      label: '📸 แคปจอ / แนบไฟล์',
                      sub: 'ไม่ต้องใช้ Gmail (แนะนำ)',
                      icon: <Camera size={15} />,
                    },
                    {
                      id: 'canvas_draw' as const,
                      label: '🎨 วาดภาพ / ผังงาน',
                      sub: 'ทำใบงานบนเว็บเลย',
                      icon: <PenTool size={15} />,
                    },
                    {
                      id: 'workstation' as const,
                      label: '🖥️ แจ้งเลขเครื่องคอมฯ',
                      sub: 'บันทึกไว้ในคอมโรงเรียน',
                      icon: <Monitor size={15} />,
                    },
                    {
                      id: 'link_text' as const,
                      label: '🔗 วางลิงก์ / พิมพ์ตอบ',
                      sub: 'ลิงก์เว็บหรือพิมพ์ข้อความ',
                      icon: <Link2 size={15} />,
                    },
                  ].map((m) => {
                    const active = submitModeTab === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSubmitModeTab(m.id)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 10,
                          textAlign: 'left',
                          cursor: 'pointer',
                          border: active ? '2px solid #0284c7' : '1px solid #cbd5e1',
                          background: active ? '#f0f9ff' : '#f8fafc',
                          color: active ? '#0369a1' : '#334155',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800, fontSize: '0.8rem' }}>
                          {m.icon} {m.label}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: active ? '#0284c7' : '#64748b', marginTop: 2 }}>
                          {m.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* แท็บที่ 1: 📸 แคปหน้าจอโปรแกรม / แนบไฟล์จากคอมพิวเตอร์โรงเรียนโดยตรง */}
                {submitModeTab === 'direct_file' && (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: 12,
                      background: '#f8fafc',
                      border: '1.5px dashed #38bdf8',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0369a1', marginBottom: 8 }}>
                      ☁️ ส่งไฟล์เข้า Google Drive กลางของครูอัตโนมัติ (เด็กไม่ต้องมี Gmail / ไม่เปลืองความจำเว็บ!):
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <button
                        type="button"
                        onClick={() => void handleOneClickScreenCapture()}
                        disabled={processingFile}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: 'none',
                          background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                        }}
                      >
                        <Camera size={16} /> 🖥️ แคปหน้าจอโปรแกรมที่ทำอยู่ (1 คลิก)
                      </button>

                      <label
                        style={{
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: '1.5px solid #0284c7',
                          background: '#ffffff',
                          color: '#0369a1',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <FolderUp size={16} /> 📁 เลือกไฟล์ส่งเข้าไดรฟ์ครู (.sb3, รูป, Word, PPT, PDF)
                        <input
                          type="file"
                          accept="image/*,.sb3,.py,.html,.pdf,.docx,.pptx,.txt"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleDirectFileAttach(file, file.name, 'screenshot_file');
                          }}
                        />
                      </label>

                      {loadGoogleDriveBridgeConfig().sharedFolderUrl && (
                        <a
                          href={loadGoogleDriveBridgeConfig().sharedFolderUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1.5px solid #16a34a',
                            background: '#f0fdf4',
                            color: '#15803d',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <ExternalLink size={15} /> 📂 เปิดโฟลเดอร์ Google Drive ห้องเรียน
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#475569' }}>
                      💡 <strong>ระบบประหยัดความจำ 100%:</strong> เมื่อเลือกไฟล์หรือกด <kbd style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: 4 }}>Ctrl + V</kbd> วางภาพหน้าจอ ระบบจะส่งไฟล์เข้า <strong>Google Drive กลางของคุณครู</strong> โดยตรงและเก็บเฉพาะลิงก์ในเว็บ (ไม่กินความจำฐานข้อมูลเว็บ และนักเรียนไม่ต้องล็อกอิน Gmail ตัวเองครับ)
                    </div>
                  </div>
                )}

                {/* แท็บที่ 2: 🎨 กระดานวาดภาพ / เขียนผังงาน (Flowchart) ในเว็บ */}
                {submitModeTab === 'canvas_draw' && (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: 12,
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                        🎨 กระดานวาดภาพ / เขียนผังงานอัลกอริทึม (วาดด้วยเมาส์ได้เลย):
                      </strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        {['#1e3a8a', '#0f172a', '#dc2626', '#16a34a', '#d97706', '#7c3aed'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              setPenColor(color);
                              setIsEraser(false);
                            }}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: color,
                              border: !isEraser && penColor === color ? '3px solid #38bdf8' : '1px solid #cbd5e1',
                              cursor: 'pointer',
                            }}
                            title="เลือกสีปากกา"
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => setIsEraser(!isEraser)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            border: '1px solid #cbd5e1',
                            background: isEraser ? '#fee2e2' : '#ffffff',
                            color: isEraser ? '#b91c1c' : '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          🧽 ยางลบ
                        </button>
                        <button
                          type="button"
                          onClick={initDrawingCanvas}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            cursor: 'pointer',
                          }}
                        >
                          ล้างกระดาน
                        </button>
                      </div>
                    </div>

                    <canvas
                      ref={drawCanvasRef}
                      width={560}
                      height={280}
                      onMouseDown={startDrawing}
                      onMouseMove={drawMove}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={drawMove}
                      onTouchEnd={stopDrawing}
                      style={{
                        width: '100%',
                        height: 240,
                        background: '#ffffff',
                        border: '1.5px solid #94a3b8',
                        borderRadius: 8,
                        cursor: isEraser ? 'cell' : 'crosshair',
                        touchAction: 'none',
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <label style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                        ขนาดเส้น:
                        <input
                          type="range"
                          min={2}
                          max={12}
                          value={penSize}
                          onChange={(e) => setPenSize(Number(e.target.value))}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => void saveCanvasToAttachment()}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#16a34a',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        📌 แนบภาพที่วาดนี้ส่งครู
                      </button>
                    </div>
                  </div>
                )}

                {/* แท็บที่ 3: 🖥️ แจ้งหมายเลขเครื่องคอมพิวเตอร์ห้องเรียน */}
                {submitModeTab === 'workstation' && (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: 12,
                      background: '#f5f3ff',
                      border: '1.5px solid #c4b5fd',
                      marginBottom: 12,
                    }}
                  >
                    <label style={{ fontWeight: 800, fontSize: '0.85rem', color: '#4c1d95', display: 'block', marginBottom: 6 }}>
                      🖥️ เลือกหมายเลขเครื่องคอมพิวเตอร์ที่เธอนั่งทำ (หรือส่งสมุดที่โต๊ะครู):
                    </label>
                    <select
                      aria-label="หมายเลขเครื่องคอมพิวเตอร์"
                      value={workstationNo}
                      onChange={(e) => {
                        setWorkstationNo(e.target.value);
                        setSubmissionMethod('workstation');
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: 8,
                        border: '1px solid #a78bfa',
                        background: '#ffffff',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: '#1e293b',
                      }}
                    >
                      <option value="">-- คลิกเลือกหมายเลขเครื่องคอมพิวเตอร์ (เครื่องที่ 01 - 30) --</option>
                      {WORKSTATION_OPTIONS.map((ws) => (
                        <option key={ws} value={ws}>
                          🖥️ {ws}
                        </option>
                      ))}
                    </select>
                    <div style={{ fontSize: '0.76rem', color: '#5b21b6', marginTop: 6 }}>
                      💡 เหมาะสำหรับน้องๆ ที่บันทึกไฟล์งานไว้ในเครื่องคอมพิวเตอร์โรงเรียน (เช่น บนหน้าจอ Desktop หรือโฟลเดอร์ชื่อตัวเอง) แล้วพิมพ์บอกชื่อไฟล์ในช่องคำอธิบายด้านล่างครับ
                    </div>
                  </div>
                )}

                {/* แสดงตัวอย่างไฟล์/ภาพแคปหน้าจอที่แนบแล้ว + ป้ายยืนยันการส่งเข้า Google Drive ประหยัดความจำ */}
                {(uploadedToDrive || contentData || attachmentFileName) && (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: '#f0fdf4',
                      border: '1.5px solid #86efac',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534' }}>
                        {uploadedToDrive
                          ? `☁️ อัปโหลดเข้า Google Drive ของคุณครูสำเร็จแล้ว: ${attachmentFileName || 'ไฟล์ผลงาน'} (เก็บเฉพาะลิงก์ ไม่เปลืองความจำเว็บ 100%)`
                          : `✅ แนบผลงานพร้อมส่งแล้ว: ${attachmentFileName || 'ภาพหน้าจอผลงาน'} (โหมดภาพย่อประหยัดความจำ)`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {uploadedToDrive && contentUrl && (
                          <a
                            href={contentUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: '#e0f2fe',
                              color: '#0369a1',
                              border: '1px solid #7dd3fc',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            🔗 เปิดดูใน Google Drive
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setContentData('');
                            setLocalPreviewUrl('');
                            if (uploadedToDrive) setContentUrl('');
                            setUploadedToDrive(false);
                            setAttachmentFileName('');
                            setAttachmentMimeType('');
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid #fca5a5',
                            background: '#fef2f2',
                            color: '#dc2626',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Trash2 size={13} /> ลบไฟล์แนบ
                        </button>
                      </div>
                    </div>
                    {(localPreviewUrl || contentData).startsWith('data:image/') || (localPreviewUrl || '').startsWith('blob:') ? (
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <img
                          src={localPreviewUrl || contentData}
                          alt="ตัวอย่างผลงานที่แนบ"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 190,
                            borderRadius: 8,
                            border: '1px solid #bbf7d0',
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                {/* ช่องวางลิงก์ (แสดงเมื่อเลือกแท็บวางลิงก์ หรือกรอกเพิ่มเติมได้) */}
                {submitModeTab === 'link_text' && (
                  <div style={{ marginTop: 8, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 }}>
                      <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>📎 ลิงก์ผลงาน (กรณีมีลิงก์ Canva, Scratch, เว็บไซต์)</label>
                      <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>💡 หากไม่มี Gmail ใช้แท็บ &ldquo;📸 แคปจอ / แนบไฟล์&rdquo; ด้านบนแทนได้เลย</span>
                    </div>
                    <input
                      value={contentUrl}
                      onChange={(e) => setContentUrl(e.target.value)}
                      placeholder="https://www.canva.com/design/... หรือ https://scratch.mit.edu/projects/..."
                      style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                <div style={{ marginTop: 8 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    💬 คำตอบ / ชื่อไฟล์ที่บันทึก / คำอธิบายผลงาน {contentData ? '(ไม่บังคับ)' : '(ส่งข้อความแทนลิงก์ได้)'}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      workstationNo
                        ? `เช่น บันทึกไฟล์ชื่อ งานของฉัน.sb3 ไว้ที่หน้าจอ Desktop ${workstationNo} ครับ`
                        : 'พิมพ์คำตอบของใบงาน หรืออธิบายสั้นๆ เกี่ยวกับผลงานที่ทำครับ...'
                    }
                    rows={3}
                    style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={closeSubmission} className="btn-secondary" disabled={syncing || processingFile}>ยกเลิก</button>
              <button onClick={() => void handleSubmit()} className="btn-primary" disabled={syncing || processingFile}>
                {syncing ? 'กำลังส่ง...' : processingFile ? 'กำลังเตรียมไฟล์...' : 'ส่งงาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkStudent;
