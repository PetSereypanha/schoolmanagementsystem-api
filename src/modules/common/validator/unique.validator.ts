import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ async: true })
@Injectable()
export class UniqueValidator implements ValidatorConstraintInterface {
  constructor(private prisma: PrismaService) {}

  async validate(value: any, args: UniqueValidationArguments<any>) {
    const [modelName, field] = args.constraints;

    if (!this.prisma[modelName]) {
      throw new Error(`Invalid Prisma model: ${modelName}`);
    }

    const model = this.prisma[modelName];

    try {
      const count = await model.count({
        where: {
          [field || args.property]: value,
        },
      });
      return count <= 0;
    } catch (error) {
      throw new Error(`Validation failed: ${error.message}`);
    }
  }

  defaultMessage(args: ValidationArguments) {
    const [model] = args.constraints;
    return `${model} with the same ${args.property} already exists`;
  }
}

type UniqueValidationConstraints = [
  string, // Prisma model name
  string?, // Field name (optional)
];

interface UniqueValidationArguments<T extends object>
  extends ValidationArguments {
  constraints: UniqueValidationConstraints;
  object: T;
}

export function Unique(
  constraints: UniqueValidationConstraints,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints,
      validator: UniqueValidator,
    });
  };
}
