import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'نام دپارتمان نمی‌تواند خالی باشد' })
  @MinLength(2, { message: 'نام دپارتمان باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(100, { message: 'نام دپارتمان باید حداکثر ۱۰۰ کاراکتر باشد' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'توضیحات باید حداکثر ۵۰۰ کاراکتر باشد' })
  description?: string;
}