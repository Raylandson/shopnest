import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class SearchProductDto {
  @ApiPropertyOptional({
    description: 'Partial or full name of the product to search for.',
    example: 'Laptop',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Category of the product to filter by.',
    example: 'Electronics',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Keywords to search for in the product description.',
    example: 'gaming',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Minimum price for the product range.',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price for the product range.',
    example: 1500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}
