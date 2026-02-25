import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'متن پیام نمی‌تواند خالی باشد' })
  @MinLength(1, { message: 'پیام باید حداقل ۱ کاراکتر باشد' })
  @MaxLength(1000, { message: 'پیام باید حداکثر ۱۰۰۰ کاراکتر باشد' })
  message: string;
}