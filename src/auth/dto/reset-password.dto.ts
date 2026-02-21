import { IsString, IsNotEmpty, MinLength, IsUUID } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'توکن نمی‌تواند خالی باشد' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'رمز عبور جدید نمی‌تواند خالی باشد' })
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' })
  newPassword: string;
}