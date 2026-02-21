import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'نام نقش نمی‌تواند خالی باشد' })
  @MinLength(2, { message: 'نام نقش باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(50, { message: 'نام نقش باید حداکثر ۵۰ کاراکتر باشد' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'توضیحات باید حداکثر ۲۰۰ کاراکتر باشد' })
  description?: string;

  @IsArray()
  @IsNumber({}, { each: true, message: 'آیدی مجوزها باید عدد باشند' })
  @IsOptional()
  permissionIds?: number[];
}