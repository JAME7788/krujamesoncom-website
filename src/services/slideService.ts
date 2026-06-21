import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { RichSlide } from '../data/richSlides';

const firebaseAvailable = (): boolean => {
  try {
    return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
  } catch {
    return false;
  }
};

export const saveCustomSlides = async (gradeId: string, unitNo: number, slides: RichSlide[]) => {
  try {
    const key = `custom_slides_${gradeId}_${unitNo}`;
    localStorage.setItem(key, JSON.stringify(slides));

    if (firebaseAvailable()) {
      const ref = doc(db, 'custom_slides', `${gradeId}_${unitNo}`);
      await setDoc(ref, { gradeId, unitNo, slides, updatedAt: Date.now() });
    }
    return true;
  } catch (e) {
    console.error('Failed to save custom slides', e);
    return false;
  }
};

export const fetchCustomSlides = async (gradeId: string, unitNo: number): Promise<RichSlide[] | null> => {
  try {
    if (firebaseAvailable()) {
      const ref = doc(db, 'custom_slides', `${gradeId}_${unitNo}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data?.slides) {
          localStorage.setItem(`custom_slides_${gradeId}_${unitNo}`, JSON.stringify(data.slides));
          return data.slides;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch custom slides from Firebase', e);
  }
  // Fallback to local storage
  const local = localStorage.getItem(`custom_slides_${gradeId}_${unitNo}`);
  return local ? JSON.parse(local) : null;
};

const extractLeadingEmoji = (str: string): { emoji: string | null; cleanStr: string } => {
  const match = str.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\u2300-\u25FF]|[\u2B50]|\p{Emoji_Presentation})/u);
  if (match) {
    const emoji = match[0];
    let cleanStr = str.substring(emoji.length).trim();
    cleanStr = cleanStr.replace(/^[:\-\s|]+/, '').trim();
    return { emoji, cleanStr };
  }
  return { emoji: null, cleanStr: str };
};

export const parseMarkdownToSlides = (md: string): RichSlide[] => {
  const slides: RichSlide[] = [];
  
  let sections: string[] = [];
  const hasThreeDashes = /(?:^|\n)---(?:\n|$)/.test(md);
  
  if (hasThreeDashes) {
    sections = md.split(/(?:^|\n)---(?:\n|$)/);
  } else {
    // If no "---", check if there are multiple H1 headers (# ) to split by
    const h1Count = (md.match(/(?:^|\n)#\s/g) || []).length;
    if (h1Count > 1) {
      sections = md.split(/(?=(?:^|\n)#\s)/);
    } else {
      // Check if there are multiple H2 headers (## ) to split by
      const h2Count = (md.match(/(?:^|\n)##\s/g) || []).length;
      if (h2Count > 1) {
        sections = md.split(/(?=(?:^|\n)##\s)/);
      } else {
        sections = [md];
      }
    }
  }
  
  sections.forEach((sec) => {
    const cleanSec = sec.trim();
    if (!cleanSec) return;

    const lines = cleanSec.split('\n');
    let title = '';
    let emoji = '';
    let theme: 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'yellow' | 'red' = 'blue';
    let layout: 'standard' | 'split' | 'cover' | 'quote' | 'comparison' = 'standard';
    let body = '';
    const bullets: { text: string }[] = [];
    let isCodeBlock = false;
    const codeContent: string[] = [];
    let codeLang = 'python';

    const parseHeader = (rawTitle: string): string => {
      let clean = rawTitle.replace(/^(?:slide|สไลด์)\s*\d+[:\s-]*/i, '').trim();
      clean = clean.replace(/^\d+[:\s.-]+\s*/, '').trim();
      const emojiRes = extractLeadingEmoji(clean);
      if (emojiRes.emoji) {
        if (!emoji) emoji = emojiRes.emoji;
        return emojiRes.cleanStr;
      }
      return clean;
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Handle code blocks
      if (trimmed.startsWith('```')) {
        if (isCodeBlock) {
          isCodeBlock = false;
        } else {
          isCodeBlock = true;
          codeLang = trimmed.slice(3).trim() || 'python';
        }
        return;
      }

      if (isCodeBlock) {
        codeContent.push(line); // Keep spaces for code
        return;
      }

      if (trimmed.startsWith('# ')) {
        title = parseHeader(trimmed.slice(2).trim());
      } else if (trimmed.startsWith('## ')) {
        if (!title) {
          title = parseHeader(trimmed.slice(3).trim());
        } else {
          // If we already have a title, treat as regular line
          if (!body) body = trimmed;
          else body += '\n' + trimmed;
        }
      } else if (trimmed.startsWith('emoji:')) {
        emoji = trimmed.slice(6).trim();
      } else if (trimmed.startsWith('theme:')) {
        const val = trimmed.slice(6).trim();
        if (['blue', 'green', 'orange', 'purple', 'pink', 'yellow', 'red'].includes(val)) {
          theme = val as 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'yellow' | 'red';
        }
      } else if (trimmed.startsWith('layout:')) {
        const val = trimmed.slice(7).trim();
        if (['standard', 'split', 'cover', 'quote', 'comparison'].includes(val)) {
          layout = val as 'standard' | 'split' | 'cover' | 'quote' | 'comparison';
        }
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        bullets.push({ text: trimmed.slice(2).trim() });
      } else if (trimmed) {
        if (!body) body = trimmed;
        else body += '\n' + trimmed;
      }
    });

    if (title || body || codeContent.length > 0) {
      const slide: RichSlide = {
        title: title || 'สไลด์ใหม่',
        emoji: emoji || undefined,
        theme: theme || undefined,
        layout: layout || undefined,
        body: body || undefined,
        bullets: bullets.length ? bullets : undefined,
      };

      if (codeContent.length > 0) {
        slide.code = {
          lang: codeLang,
          content: codeContent.join('\n'),
        };
      }

      slides.push(slide);
    }
  });

  return slides;
};

export const slidesToMarkdown = (slides: RichSlide[]): string => {
  return slides.map((slide) => {
    let md = `# ${slide.title}\n`;
    if (slide.emoji) md += `emoji: ${slide.emoji}\n`;
    if (slide.theme) md += `theme: ${slide.theme}\n`;
    if (slide.layout) md += `layout: ${slide.layout}\n`;
    md += `\n`;
    if (slide.body) md += `${slide.body}\n\n`;
    if (slide.bullets) {
      slide.bullets.forEach((b) => {
        md += `- ${b.text}\n`;
      });
      md += `\n`;
    }
    if (slide.code) {
      md += `\`\`\`${slide.code.lang || 'python'}\n`;
      md += `${slide.code.content}\n`;
      md += `\`\`\`\n\n`;
    }
    return md;
  }).join('---\n');
};
