import { buildStoragePath, folderForMime, toObjectName } from './path.util';
import { resolveStorageProviderName } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER_GCS, STORAGE_PROVIDER_STATIC } from './storage.constants';

describe('storage path utils', () => {
  it('maps mime types to folders', () => {
    expect(folderForMime('image/png')).toBe('images');
    expect(folderForMime('application/pdf')).toBe('documents');
    expect(folderForMime('application/octet-stream')).toBe('files');
  });

  it('builds dated storage paths with leading slash', () => {
    const path = buildStoragePath('photo.PNG', 'image/png', 'avatar');
    expect(path).toMatch(/^\/images\/\d{4}\/\d{2}\/\d{2}\/avatar-[0-9a-f-]+\.PNG$/);
  });

  it('strips leading slash for object names', () => {
    expect(toObjectName('/images/a.png')).toBe('images/a.png');
    expect(toObjectName('images/a.png')).toBe('images/a.png');
  });
});

describe('resolveStorageProviderName', () => {
  const mockConfig = (value?: string) =>
    ({
      get: (key: string) => (key === 'STORAGE_PROVIDER' ? value : undefined),
    }) as ConfigService;

  it('defaults to gcs', () => {
    expect(resolveStorageProviderName(mockConfig(undefined))).toBe(STORAGE_PROVIDER_GCS);
    expect(resolveStorageProviderName(mockConfig(''))).toBe(STORAGE_PROVIDER_GCS);
  });

  it('accepts static legacy', () => {
    expect(resolveStorageProviderName(mockConfig('static'))).toBe(STORAGE_PROVIDER_STATIC);
    expect(resolveStorageProviderName(mockConfig('STATIC'))).toBe(STORAGE_PROVIDER_STATIC);
  });

  it('rejects unknown providers', () => {
    expect(() => resolveStorageProviderName(mockConfig('disk'))).toThrow(/Invalid STORAGE_PROVIDER/);
  });
});
