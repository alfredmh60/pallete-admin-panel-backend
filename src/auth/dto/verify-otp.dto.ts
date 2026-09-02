import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { IsIranianMobile } from '../../common/validators/is-iranian-mobile.validator';

export class VerifyOtpDto {
  @IsString({ message: 'شماره موبایل باید متن باشد' })
  @IsNotEmpty({ message: 'شماره موبایل نمی‌تواند خالی باشد' })
  @IsIranianMobile()
  phone: string;

  @IsString({ message: 'کد تأیید باید متن باشد' })
  @IsNotEmpty({ message: 'کد تأیید نمی‌تواند خالی باشد' })
  @Length(6, 6, { message: 'کد تأیید باید ۶ رقم باشد' })
  @Matches(/^\d{6}$/, { message: 'کد تأیید باید فقط شامل اعداد باشد' })
  otp: string;
}
