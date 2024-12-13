import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function SameAs(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'sameAs',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} must match ${property}`,
        ...validationOptions
      },
      constraints: [property],
      validator: {
        validate(value: any, args: ValidationArguments) {
            const [relatedPropertyName] = args.constraints;
            const relatedValue = (args.object as any)[relatedPropertyName];
            return value === relatedValue;
          },
        defaultMessage(args: ValidationArguments) {
            const [relatedPropertyName] = args.constraints;
            return `${args.property} must match ${relatedPropertyName}`;
        }
      },
    });
  };
}
