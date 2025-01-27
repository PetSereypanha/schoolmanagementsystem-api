import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmMail {
  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}