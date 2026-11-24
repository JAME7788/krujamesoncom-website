import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { extractGoogleDriveFileId, getNextDriveImageFallbackUrl } from '../src/utils/googleDriveImage';

const readRepoFile = (relPath: string) =>
  readFileSync(fileURLToPath(new URL(`../${relPath}`, import.meta.url)), 'utf8');

describe('Systematic Debugging Regression: Google Drive Slide ORB & Narrow 3D HUD', () => {
  it('extracts Google Drive file IDs from lh3, thumbnail, and download URLs', () => {
    const id = '1nLS0sW66lZbuM2PKiAZXQ3Qt_ag6ZRBm';
    expect(extractGoogleDriveFileId(`https://lh3.googleusercontent.com/d/${id}`)).toBe(id);
    expect(extractGoogleDriveFileId(`https://drive.google.com/thumbnail?id=${id}&sz=w1600`)).toBe(id);
    expect(extractGoogleDriveFileId(`https://drive.usercontent.google.com/download?id=${id}&export=view`)).toBe(id);
    expect(extractGoogleDriveFileId('/images/local-cover.png')).toBeNull();
  });

  it('chains Drive image fallbacks cleanly and terminates with null (no infinite retry loop)', () => {
    const id = '1nLS0sW66lZbuM2PKiAZXQ3Qt_ag6ZRBm';
    const primary = `https://lh3.googleusercontent.com/d/${id}`;
    const step1 = getNextDriveImageFallbackUrl(primary, primary);
    expect(step1).toBe(`https://drive.google.com/thumbnail?id=${id}&sz=w1600`);

    const step2 = getNextDriveImageFallbackUrl(step1!, primary);
    expect(step2).toBe(`https://drive.usercontent.google.com/download?id=${id}&export=view`);

    const step3 = getNextDriveImageFallbackUrl(step2!, primary);
    expect(step3).toBeNull();
  });

  it.each([
    'src/pages/UnitDetail.tsx',
    'src/pages/IsKnowledgeBlog.tsx',
    'src/components/SlideManager.tsx',
    'src/components/RichSlideViewer.tsx',
  ])('sets referrerPolicy="no-referrer" on Google Drive slide image viewers in %s', (file) => {
    const content = readRepoFile(file);
    expect(content).toContain('referrerPolicy="no-referrer"');
  });

  it('prevents top HUD overlap on medium/tablet viewports (721px..1120px) in VirtualClassroom.css', () => {
    const css = readRepoFile('src/pages/VirtualClassroom.css');
    expect(css).toMatch(/@media\s*\(max-width:\s*1120px\)/);
  });
});
