import { CartItem } from './cartItem.entity';

export class Cart {
  constructor(id: number, userId: number, items: CartItem[]) {
    this.id = id;
    this.userId = userId;
    this.items = items;
  }

  id: number;
  userId: number;
  items: CartItem[];
}
