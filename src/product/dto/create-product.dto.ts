import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // Added ApiProperty, ApiPropertyOptional
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  MaxLength,
  IsNotEmpty,
  ValidateNested, // Added
} from 'class-validator';
import { Type } from 'class-transformer'; // Added
import { ProductSpecificationDto } from './product-specification.dto'; // Added

export class CreateProductDto {
  @ApiProperty({
    example: 'Super Laptop',
    description: 'Name of the product',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'The best laptop for professionals',
    description: 'Detailed description of the product',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 1999.99, description: 'Price of the product' })
  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @ApiProperty({
    example: 'Electronics',
    description: 'Category of the product',
  })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'URL of the product image',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    type: () => [ProductSpecificationDto], // Changed to use ProductSpecificationDto
    description: 'Array of product specifications',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true }) // Added for validation of nested objects
  @Type(() => ProductSpecificationDto) // Added for class-transformer to know the type
  specifications?: ProductSpecificationDto[]; // Array of specifications

  constructor(partial: Partial<CreateProductDto>) {
    Object.assign(this, partial);
  }
}
