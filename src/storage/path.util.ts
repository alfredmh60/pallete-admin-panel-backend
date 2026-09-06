import { extname } from 'path';
import { randomUUID } from 'crypto';
import { MIME_FOLDER } from './storage.constants';

export function folderForMime(mimeType: string): string {
  return MIME_FOLDER[mimeType] ?? 'files';
}

/** Build a storage path like `/images/2026/09/06/file-<uuid>.png` (leading slash). */
export function buildStoragePath(originalName: string, mimeType: string, fieldName = 'file'): string {
  const folder = folderForMime(mimeType);
  const dateFolder = new Date().toISOString().split('T')[0].replaceAll('-', '/');
  const ext = extname(originalName) || guessExtension(mimeType);
  const fileName = `${fieldName}-${randomUUID()}${ext}`;
  return `/${folder}/${dateFolder}/${fileName}`;
}

function guessExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/avif': '.avif',
    'application/pdf': '.pdf',
    'audio/mpeg': '.mp3',
    'audio/mp4': '.m4a',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/webm': '.webm',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
  };
  return map[mimeType] ?? '';
}

export function toObjectName(storagePath: string): string {
  return storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
}
