import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidIranianMobile } from '../../utils/iranian-phone.util';

export function IsIranianMobile(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIranianMobile',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidIranianMobile(value);
        },
        defaultMessage() {
          return 'شماره موبایل معتبر نیست؛ شماره باید مانند 09123456789 یا +989123456789 باشد';
        },
      },
    });
  };
}
