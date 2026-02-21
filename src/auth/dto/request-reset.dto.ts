import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestResetDto {
  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  @IsNotEmpty({ message: 'ایمیل نمی‌تواند خالی باشد' })
  email: string;
}