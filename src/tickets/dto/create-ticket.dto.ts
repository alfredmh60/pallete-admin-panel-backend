
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEmail,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'عنوان تیکت نمی‌تواند خالی باشد' })
  @MinLength(5, { message: 'عنوان باید حداقل ۵ کاراکتر باشد' })
  @MaxLength(200, { message: 'عنوان باید حداکثر ۲۰۰ کاراکتر باشد' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'توضیحات تیکت نمی‌تواند خالی باشد' })
  @MinLength(10, { message: 'توضیحات باید حداقل ۱۰ کاراکتر باشد' })
  description: string;

  @IsNumber()
  @IsNotEmpty({ message: 'دپارتمان نمی‌تواند خالی باشد' })
  departmentId: number;

  @IsString()
  @IsNotEmpty({ message: 'شناسه مشتری نمی‌تواند خالی باشد' })
  customerId: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  @IsOptional()
  customerEmail?: string;

  @IsIn(['low', 'medium', 'high', 'urgent'], {
    message: 'اولویت باید یکی از مقادیر low, medium, high, urgent باشد',
  })
  @IsOptional()
  priority?: string;
}