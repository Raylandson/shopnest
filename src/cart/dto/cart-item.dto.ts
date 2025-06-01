import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CartItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId!: number;
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity!: number;

  constructor(partial: Partial<CartItemDto>) {
    Object.assign(this, partial);
  }
}
