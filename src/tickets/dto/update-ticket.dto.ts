import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsString()
  @IsOptional()
  @IsIn(['new', 'in_progress', 'closed', 'expired', 'archived'], {
    message: 'وضعیت نامعتبر است',
  })
  status?: string;
}