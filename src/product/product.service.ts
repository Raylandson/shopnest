import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const newProduct = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        price: createProductDto.price,
        category: createProductDto.category,
        description: createProductDto.description,
        imageUrl: createProductDto.imageUrl,
        specifications: {
          create: createProductDto.specifications?.map((spec) => ({
            name: spec.name,
            value: spec.value,
          })),
        },
      },
      include: {
        specifications: true,
      },
    });
    return newProduct;
  }

  findAll() {
    return `This action returns all product`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
