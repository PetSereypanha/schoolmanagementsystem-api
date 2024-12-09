import { Global, Module } from '@nestjs/common';
import { UniqueValidator } from './validator/unique.validator';

@Global()
@Module({
  providers: [UniqueValidator],
})
export class CommonModule {}
