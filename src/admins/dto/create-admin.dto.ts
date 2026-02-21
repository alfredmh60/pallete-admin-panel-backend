import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MinLength,
} from 'class-validator';

export class CreateAdminDto {
  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  @IsNotEmpty({ message: 'ایمیل نمی‌تواند خالی باشد' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'نام نمی‌تواند خالی باشد' })
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  name: string;

  @IsNumber()
  @IsNotEmpty({ message: 'نقش نمی‌تواند خالی باشد' })
  roleId: number;

  @IsString()
  @IsOptional()
  avatar?: string;
}