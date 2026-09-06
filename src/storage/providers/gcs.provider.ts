import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';
import { toObjectName } from '../path.util';
import { MediaStorageProvider } from './media-storage.provider';
import { STORAGE_PROVIDER_GCS } from '../storage.constants';

/**
 * Primary media backend for the admin panel — dedicated **private** GCS buckets
 * (staging: palette-admin-media-stage, prod: palette-admin-media-prod).
 * Objects are not publicly readable; serve via authenticated `GET /files/*` proxy.
 *
 * Credentials: ADC / GOOGLE_APPLICATION_CREDENTIALS (no keys in code).
 */
@Injectable()
export class GcsMediaStorageProvider implements MediaStorageProvider {
  readonly name = STORAGE_PROVIDER_GCS;
  private readonly logger = new Logger(GcsMediaStorageProvider.name);
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly filesBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucketName = (this.config.get<string>('GCS_BUCKET_NAME') || '').trim();
    if (!this.bucketName) {
      throw new Error(
        'STORAGE_PROVIDER=gcs requires GCS_BUCKET_NAME (e.g. palette-admin-media-stage or palette-admin-media-prod). Set the bucket or switch STORAGE_PROVIDER=static.',
      );
    }
    if (/^palette-media-(stage|prod)$/.test(this.bucketName)) {
      this.logger.warn(
        `GCS_BUCKET_NAME=${this.bucketName} looks like a core seller media bucket. Prefer palette-admin-media-stage / palette-admin-media-prod.`,
      );
    }
    const projectId = this.config.get<string>('GCS_PROJECT_ID') || undefined;
    this.storage = new Storage({ projectId });
    this.filesBaseUrl = (
      this.config.get<string>('PUBLIC_FILES_BASE_URL') || 'http://localhost:9051/files'
    ).replace(/\/$/, '');
    this.logger.log(
      `GCS media provider ready (private bucket=${this.bucketName}, proxy=${this.filesBaseUrl})`,
    );
  }

  private get bucket() {
    return this.storage.bucket(this.bucketName);
  }

  /**
   * Browser-facing URL — always the authenticated admin proxy, never a public GCS URL.
   * Buckets are private (public GET returns 403).
   */
  getPublicUrl(storagePath: string): string {
    const path = storagePath.startsWith('/') ? storagePath : `/${storagePath}`;
    return `${this.filesBaseUrl}${path}`;
  }

  async uploadBuffer(
    storagePath: string,
    buffer: Buffer,
    contentType?: string,
  ): Promise<void> {
    await this.bucket.file(toObjectName(storagePath)).save(buffer, {
      contentType,
      resumable: false,
    });
  }

  async getReadStream(storagePath: string): Promise<{
    readable: Readable;
    contentType?: string;
  }> {
    const file = this.bucket.file(toObjectName(storagePath));
    let contentType: string | undefined;
    try {
      const [metadata] = await file.getMetadata();
      contentType = metadata.contentType;
    } catch {
      // metadata optional — still try to stream
    }
    return {
      readable: file.createReadStream(),
      contentType,
    };
  }

  async deleteObject(storagePath: string): Promise<void> {
    await this.bucket.file(toObjectName(storagePath)).delete({ ignoreNotFound: true });
  }
}
