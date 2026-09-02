import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('staff-chat')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class StaffChatController {}
