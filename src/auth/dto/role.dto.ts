import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class RoleDto {
  @ApiProperty({
    enum: ['CLIENT', 'ADMIN'],
    example: 'CLIENT',
    description: 'The role to assign to the user',
  })
  @IsEnum(['CLIENT', 'ADMIN'])
  role!: 'CLIENT' | 'ADMIN';
}
