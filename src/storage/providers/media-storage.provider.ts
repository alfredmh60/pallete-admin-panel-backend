import { Readable } from 'stream';

export interface StoredObjectMeta {
  /** Relative path with leading slash, e.g. `/images/2026/09/06/file-….png` */
  path: string;
  /** Absolute URL suitable for `<img src>` / downloads when available */
  url: string;
  contentType?: string;
}

export interface MediaStorageProvider {
  readonly name: string;
  uploadBuffer(
    storagePath: string,
    buffer: Buffer,
    contentType?: string,
    originalName?: string,
  ): Promise<void>;
  getPublicUrl(storagePath: string): string;
  getReadStream(storagePath: string): Promise<{
    readable: Readable;
    contentType?: string;
  }>;
  deleteObject?(storagePath: string): Promise<void>;
}
