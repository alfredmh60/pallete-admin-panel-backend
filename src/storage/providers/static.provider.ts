import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';
import { MediaStorageProvider } from './media-storage.provider';
import { STORAGE_PROVIDER_STATIC } from '../storage.constants';

/**
 * Legacy media backend — SeaweedFS filer HTTP API (same as core when GCS is unset).
 * Enable with STORAGE_PROVIDER=static and FILER_URL.
 */
@Injectable()
export class StaticMediaStorageProvider implements MediaStorageProvider {
  readonly name = STORAGE_PROVIDER_STATIC;
  private readonly logger = new Logger(StaticMediaStorageProvider.name);
  private readonly filerBase: string;
  private readonly publicBase: string;

  constructor(private readonly config: ConfigService) {
    this.filerBase = (this.config.get<string>('FILER_URL') || '').replace(/\/$/, '');
    if (!this.filerBase) {
      throw new Error(
        'STORAGE_PROVIDER=static requires FILER_URL (e.g. http://localhost:8888).',
      );
    }
    // Prefer core static-server proxy so browsers never hit the filer directly.
    this.publicBase = (
      this.config.get<string>('PUBLIC_FILES_BASE_URL') ||
      this.config.get<string>('STATIC_SERVER_URL') ||
      `${this.filerBase}`
    ).replace(/\/$/, '');
    this.logger.warn(
      `Legacy static (filer) media provider active (filer=${this.filerBase}). Prefer STORAGE_PROVIDER=gcs in production.`,
    );
  }

  getPublicUrl(storagePath: string): string {
    const path = storagePath.startsWith('/') ? storagePath : `/${storagePath}`;
    return `${this.publicBase}${path}`;
  }

  async uploadBuffer(
    storagePath: string,
    buffer: Buffer,
    contentType?: string,
    originalName = 'file',
  ): Promise<void> {
    const form = new FormData();
    form.append('file', buffer, {
      filename: originalName,
      contentType: contentType || 'application/octet-stream',
    });

    const objectPath = storagePath.startsWith('/') ? storagePath : `/${storagePath}`;
    await axios.post(`${this.filerBase}${objectPath}`, form, {
      headers: form.getHeaders(),
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  }

  async getReadStream(storagePath: string): Promise<{
    readable: Readable;
    contentType?: string;
  }> {
    const objectPath = storagePath.replace(/^\//, '');
    const response = await fetch(`${this.filerBase}/${objectPath}`);
    if (!response.ok || !response.body) {
      throw new Error(`Filer read failed: ${response.status}`);
    }
    return {
      // Node fetch body is a web stream; cast matches core media-backend.
      readable: Readable.from(response.body as any),
      contentType: response.headers.get('content-type') || undefined,
    };
  }
}
