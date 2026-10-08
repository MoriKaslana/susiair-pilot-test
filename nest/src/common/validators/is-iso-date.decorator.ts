import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidIsoDate } from '../utils/date.util';

/** Accepts only real calendar dates written as YYYY-MM-DD (rejects 2026-02-30). */
export function IsIsoDate(options?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'isIsoDate',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid date in YYYY-MM-DD format`,
        ...options,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isValidIsoDate(value),
      },
    });
  };
}
