import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CartItemDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the product to add to the cart',
  })
  @IsNumber()
  @IsNotEmpty()
  productId!: number;

  @ApiProperty({ example: 2, description: 'Quantity of the product' })
  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  constructor(partial: Partial<CartItemDto>) {
    Object.assign(this, partial);
  }
}
