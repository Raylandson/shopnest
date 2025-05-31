// import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
  name!: string;
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
  @IsNumber()
  @IsNotEmpty()
  price!: number;
  @IsString()
  @IsNotEmpty()
  category!: string;
  @IsOptional()
  @IsString()
  imageUrl?: string;
  @IsOptional()
  @IsArray()
  specifications?: { name: string; value: string }[]; // Array of specifications

  constructor(partial: Partial<CreateProductDto>) {
    Object.assign(this, partial);
  }
}
