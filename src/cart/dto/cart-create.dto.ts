// import { CartItemDto } from './cart-item.dto';

export class CreateCartDto {
  constructor(userId: number) {
    this.userId = userId;
  }

  userId: number;
}
