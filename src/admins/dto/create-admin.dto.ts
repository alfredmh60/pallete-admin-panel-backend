import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsIranianMobile } from '../../common/validators/is-iranian-mobile.validator';

export class CreateAdminDto {
  @IsString({ message: 'شماره موبایل باید متن باشد' })
  @IsNotEmpty({ message: 'شماره موبایل نمی‌تواند خالی باشد' })
  @IsIranianMobile()
  phone: string;

  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'نام باید متن باشد' })
  @IsNotEmpty({ message: 'نام نمی‌تواند خالی باشد' })
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  name: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'نقش انتخاب‌شده معتبر نیست' })
  @IsNotEmpty({ message: 'نقش نمی‌تواند خالی باشد' })
  roleId: number;

  @IsString({ message: 'آدرس آواتار باید متن باشد' })
  @IsOptional()
  avatar?: string;
}
