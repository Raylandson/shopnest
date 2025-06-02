import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ProductSpecificationDto {
  @ApiProperty({
    example: 'Color',
    description: 'Name of the specification (e.g., Color, Size)',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'Red',
    description: 'Value of the specification (e.g., Red, XL)',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value!: string;
}
