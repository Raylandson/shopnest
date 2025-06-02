import { IsEnum } from 'class-validator';

export class RoleDto {
  @IsEnum(['CLIENT', 'ADMIN'])
  role!: 'CLIENT' | 'ADMIN';
}
