import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class TokenCleanupTask {
  private readonly logger = new Logger(TokenCleanupTask.name);

  constructor(private authService: AuthService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleTokenCleanup() {
    this.logger.log('purging expired tokens');
    await this.authService.cleanExpiredTokens();
    this.logger.log('expired tokens purge is completed');
  }
}