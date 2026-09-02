import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Admins } from '../../entities/admins.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Admins)
    private adminRepository: Repository<Admins>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'local-dev-admin-jwt-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const admin = await this.adminRepository.findOne({
      where: { id: payload.sub },
      relations: ['role'],
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException();
    }

    return {
      id: admin.id,
      email: admin.email,
      roleId: admin.roleId,
      role: admin.role?.name,
    };
  }
}
