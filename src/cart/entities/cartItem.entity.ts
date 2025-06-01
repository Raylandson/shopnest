export class CartItem {
  constructor(productId: number, quantity: number) {
    this.productId = productId;
    this.quantity = quantity;
  }

  productId: number;
  quantity: number;
}
