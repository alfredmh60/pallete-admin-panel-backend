import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty({ message: 'نام مجوز نمی‌تواند خالی باشد' })
  @MinLength(3, { message: 'نام مجوز باید حداقل ۳ کاراکتر باشد' })
  @MaxLength(50, { message: 'نام مجوز باید حداکثر ۵۰ کاراکتر باشد' })
  @Matches(/^[a-z_]+$/, {
    message: 'نام مجوز باید فقط با حروف کوچک و زیرخط باشد (مثال: view_admins)',
  })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'توضیحات باید حداکثر ۲۰۰ کاراکتر باشد' })
  description?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z_]+$/, {
    message: 'دسته‌بندی باید فقط با حروف کوچک و زیرخط باشد',
  })
  category?: string;
}