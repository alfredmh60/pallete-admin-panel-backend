import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';


@Injectable()
export class BlacklistGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (token && await this.authService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('توکن منقضی شده است');
    }

    return true;
  }
}