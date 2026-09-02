import { IsNotEmpty, IsString } from 'class-validator';
import { IsIranianMobile } from '../../common/validators/is-iranian-mobile.validator';

export class RequestOtpDto {
  @IsString({ message: 'شماره موبایل باید متن باشد' })
  @IsNotEmpty({ message: 'شماره موبایل نمی‌تواند خالی باشد' })
  @IsIranianMobile()
  phone: string;
}
