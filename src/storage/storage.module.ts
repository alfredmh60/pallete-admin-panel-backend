import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GcsMediaStorageProvider } from './providers/gcs.provider';
import { StaticMediaStorageProvider } from './providers/static.provider';
import {
  MEDIA_STORAGE_PROVIDER,
  StorageService,
  resolveStorageProviderName,
} from './storage.service';
import { STORAGE_PROVIDER_GCS } from './storage.constants';
import { UploadController } from './upload.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [
    {
      provide: MEDIA_STORAGE_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider = resolveStorageProviderName(config);
        if (provider === STORAGE_PROVIDER_GCS) {
          return new GcsMediaStorageProvider(config);
        }
        return new StaticMediaStorageProvider(config);
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
