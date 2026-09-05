import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSellerTicketDto {
  @IsString()
  @IsIn(['support', 'finance'])
  subject: 'support' | 'finance';

  @IsOptional()
  @IsString()
  @IsIn(['open', 'close', 'closed'])
  status?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  description: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  fileMimeType?: string;
}

export class AnswerSellerTicketDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  message: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  fileMimeType?: string;
}

export class StaffReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  message: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  fileMimeType?: string;
}

export class StaffInternalNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  message: string;
}

export class AssignTicketDto {
  @IsOptional()
  adminId?: number | null;
}
