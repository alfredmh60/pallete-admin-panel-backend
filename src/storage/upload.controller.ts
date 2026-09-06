import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StorageService } from './storage.service';
import { MAX_UPLOAD_BYTES } from './storage.constants';

@Controller()
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly storageService: StorageService) {}

  /**
   * Authenticated multipart upload.
   * Field name: `file`
   * Response: `{ path, url, contentType, provider }`
   * `url` points at `GET /files/...` (JWT required) — buckets are private.
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file field is required');
    }
    const stored = await this.storageService.uploadFile(file);
    return {
      ...stored,
      provider: this.storageService.getProviderName(),
    };
  }

  /**
   * Authenticated stream of a stored object (GCS or legacy filer).
   * Example: GET /files/images/2026/09/06/file-….png
   * Never redirects to a public GCS URL — admin buckets are private.
   */
  @Get('files/*')
  @UseGuards(JwtAuthGuard)
  async getFile(@Req() req: Request, @Res() res: Response) {
    const relative = req.path.replace(/^\/files\/?/, '');
    if (!relative) {
      throw new NotFoundException('File path required');
    }

    const storagePath = relative.startsWith('/') ? relative : `/${relative}`;

    try {
      const { readable, contentType } =
        await this.storageService.openReadStream(storagePath);
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      res.setHeader('Cache-Control', 'private, max-age=300');
      readable.on('error', (err) => {
        this.logger.error(`Stream error for ${storagePath}: ${err.message}`);
        if (!res.headersSent) {
          res.status(404).json({ message: 'File not found' });
        } else {
          res.destroy(err);
        }
      });
      readable.pipe(res);
    } catch (error) {
      this.logger.warn(
        `Failed to read ${storagePath}: ${(error as Error)?.message ?? error}`,
      );
      throw new NotFoundException('File not found');
    }
  }
}
