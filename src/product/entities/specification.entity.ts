export class Specification {
  constructor(id: number, name: string, value: string, productId: number) {
    this.id = id;
    this.name = name;
    this.value = value;
    this.productId = productId;
  }
  id: number;
  name: string;
  value: string;
  productId: number;
}
