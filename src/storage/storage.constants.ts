/** Primary provider. Switch to `static` only when you need the legacy SeaweedFS filer path. */
export const STORAGE_PROVIDER_GCS = 'gcs' as const;
/** Legacy: upload/read via SeaweedFS filer (`FILER_URL`), same plane as core static-server. */
export const STORAGE_PROVIDER_STATIC = 'static' as const;

export type StorageProviderName =
  | typeof STORAGE_PROVIDER_GCS
  | typeof STORAGE_PROVIDER_STATIC;

export const DEFAULT_STORAGE_PROVIDER: StorageProviderName = STORAGE_PROVIDER_GCS;

/** Multer / request ceiling — mirrors core static-server global limit. */
export const MAX_UPLOAD_BYTES = 25 * 1000 * 1000;

export const ALLOWED_MIME_TYPES = [
  // images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  // documents
  'application/pdf',
  // audio / video (ticket attachments)
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export const MIME_FOLDER: Record<string, string> = {
  'image/jpeg': 'images',
  'image/png': 'images',
  'image/gif': 'images',
  'image/webp': 'images',
  'image/avif': 'images',
  'application/pdf': 'documents',
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/webm': 'audio',
  'video/mp4': 'videos',
  'video/webm': 'videos',
  'video/quicktime': 'videos',
};
