import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'The username for registration',
    minLength: 2,
    maxLength: 22,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(22)
  username: string;

  @ApiProperty({
    example: 'P@$$wOrd123',
    description: 'The password for registration',
    minLength: 8,
    maxLength: 22,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(22)
  password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
}
