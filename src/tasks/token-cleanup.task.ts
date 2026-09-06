import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth/auth.service';
import { SellerAuthService } from '../ticketing/seller-auth.service';

@Injectable()
export class TokenCleanupTask {
  private readonly logger = new Logger(TokenCleanupTask.name);

  constructor(
    private authService: AuthService,
    private sellerAuthService: SellerAuthService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleTokenCleanup() {
    this.logger.log('purging expired tokens');
    await this.authService.cleanExpiredTokens();
    const sellerPurged = await this.sellerAuthService.purgeExpiredSessions();
    this.logger.log(`expired tokens purge completed (seller sessions: ${sellerPurged})`);
  }
}
