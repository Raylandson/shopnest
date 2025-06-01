export class CreateOrderDto {
  constructor(userId: number, productIds: number[], totalAmount: number) {
    this.userId = userId;
    this.productIds = productIds;
    this.totalAmount = totalAmount;
  }

  userId: number;
  productIds: number[];
  totalAmount: number;
}
