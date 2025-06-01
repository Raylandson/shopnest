import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(22)
  username: string;
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
