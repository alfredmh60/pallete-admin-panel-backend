import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SellerAuthService, ValidatedSeller } from './seller-auth.service';

export const SELLER_REQUEST_KEY = 'seller';

@Injectable()
export class SellerAuthGuard implements CanActivate {
  constructor(private readonly sellerAuthService: SellerAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      [SELLER_REQUEST_KEY]?: ValidatedSeller;
    }>();

    const seller = await this.sellerAuthService.validateBearerToken(
      request.headers.authorization,
    );

    if (!seller?.userId) {
      throw new UnauthorizedException('Invalid or expired seller token');
    }

    request[SELLER_REQUEST_KEY] = seller;
    return true;
  }
}
