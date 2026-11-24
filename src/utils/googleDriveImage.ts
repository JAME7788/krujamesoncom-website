/**
 * Google Drive image URL helpers & fallback chain.
 *
 * Root cause note:
 *   Google's `lh3.googleusercontent.com/d/{id}` rejects requests carrying an
 *   external `Referer` header with HTTP 429 (`text/html`), which Chromium's ORB
 *   (Opaque Response Blocking) converts into `net::ERR_BLOCKED_BY_ORB`.
 *   Always pair Google Drive `<img>` tags with `referrerPolicy="no-referrer"`
 *   and use `getNextDriveImageFallbackUrl` inside `onError`.
 */

export const extractGoogleDriveFileId = (url: string): string | null => {
  if (!url) return null;
  const pathMatch = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (pathMatch) return pathMatch[1];
  const queryMatch = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (queryMatch) return queryMatch[1];
  return null;
};

export const getNextDriveImageFallbackUrl = (
  currentSrc: string,
  originalUrl: string,
): string | null => {
  const fileId = extractGoogleDriveFileId(originalUrl) || extractGoogleDriveFileId(currentSrc);
  if (!fileId) return null;

  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  const downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;

  if (!currentSrc.includes('drive.google.com/thumbnail') && !currentSrc.includes('drive.usercontent.google.com')) {
    return thumbnailUrl;
  }
  if (currentSrc.includes('drive.google.com/thumbnail')) {
    return downloadUrl;
  }
  return null;
};
