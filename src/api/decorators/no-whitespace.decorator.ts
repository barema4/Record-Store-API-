import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function NoWhitespace(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'noWhitespace',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return true;
          return value.trim().length > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} cannot be empty or contain only whitespace`;
        },
      },
    });
  };
} 