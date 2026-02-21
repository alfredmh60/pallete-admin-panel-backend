import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  @IsNotEmpty({ message: 'ایمیل نمی‌تواند خالی باشد' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'رمز عبور نمی‌تواند خالی باشد' })
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' })
  password: string;
}