import { IsNotEmpty, IsNumber } from 'class-validator';

export class CartItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId!: number;
  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  constructor(partial: Partial<CartItemDto>) {
    Object.assign(this, partial);
  }
}
