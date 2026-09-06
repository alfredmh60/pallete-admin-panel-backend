import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { buildStoragePath } from './path.util';
import type { MediaStorageProvider, StoredObjectMeta } from './providers/media-storage.provider';
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  STORAGE_PROVIDER_GCS,
  STORAGE_PROVIDER_STATIC,
  StorageProviderName,
  DEFAULT_STORAGE_PROVIDER,
} from './storage.constants';

export const MEDIA_STORAGE_PROVIDER = Symbol('MEDIA_STORAGE_PROVIDER');

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(MEDIA_STORAGE_PROVIDER) private readonly provider: MediaStorageProvider,
  ) {
    this.logger.log(`Active media storage provider: ${this.provider.name}`);
  }

  getProviderName(): string {
    return this.provider.name;
  }

  async uploadFile(
    file: Express.Multer.File,
    options?: { fieldName?: string },
  ): Promise<StoredObjectMeta> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file uploaded');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw new UnsupportedMediaTypeException(`Unsupported file type: ${file.mimetype}`);
    }

    const size = file.size ?? file.buffer.byteLength;
    if (size > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(
        `File exceeds maximum size of ${MAX_UPLOAD_BYTES / 1_000_000} MB`,
      );
    }

    const storagePath = buildStoragePath(
      file.originalname || 'file',
      file.mimetype,
      options?.fieldName || file.fieldname || 'file',
    );

    try {
      await this.provider.uploadBuffer(
        storagePath,
        file.buffer,
        file.mimetype,
        file.originalname,
      );
    } catch (error) {
      this.logger.error(
        `Upload failed via ${this.provider.name}: ${(error as Error)?.message ?? error}`,
      );
      throw new BadRequestException('Failed to store uploaded file');
    }

    return {
      path: storagePath,
      url: this.provider.getPublicUrl(storagePath),
      contentType: file.mimetype,
    };
  }

  resolvePublicUrl(storagePath: string): string {
    if (/^https?:\/\//i.test(storagePath)) {
      return storagePath;
    }
    return this.provider.getPublicUrl(storagePath);
  }

  async openReadStream(storagePath: string): Promise<{
    readable: Readable;
    contentType?: string;
  }> {
    return this.provider.getReadStream(storagePath);
  }
}

export function resolveStorageProviderName(config: ConfigService): StorageProviderName {
  const raw = (config.get<string>('STORAGE_PROVIDER') || DEFAULT_STORAGE_PROVIDER)
    .trim()
    .toLowerCase();

  if (raw === STORAGE_PROVIDER_STATIC) {
    return STORAGE_PROVIDER_STATIC;
  }
  if (raw === STORAGE_PROVIDER_GCS || raw === '') {
    return STORAGE_PROVIDER_GCS;
  }

  throw new Error(
    `Invalid STORAGE_PROVIDER="${raw}". Use "${STORAGE_PROVIDER_GCS}" (primary) or "${STORAGE_PROVIDER_STATIC}" (legacy).`,
  );
}
