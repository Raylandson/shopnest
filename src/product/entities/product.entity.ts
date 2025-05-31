import { Specification } from './specification.entity';

export class Product {
  constructor(
    id: number,
    name: string,
    price: number,
    category: string,
    createdAt: Date,
    updatedAt: Date,
    description?: string,
    imageUrl?: string,
    specifications?: Specification[],
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.category = category;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.description = description;
    this.imageUrl = imageUrl;
    this.specifications = specifications;
  }

  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  specifications?: Specification[];
}
