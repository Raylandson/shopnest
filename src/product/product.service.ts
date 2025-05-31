import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

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

  async findAll() {
    return await this.prisma.product.findMany({
      include: {
        specifications: true,
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { specifications: true },
    });
    if (product === null) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      const { specifications, ...productData } = updateProductDto;

      // Always update product data first
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: productData,
        include: { specifications: true },
      });

      // Only handle specifications if they are explicitly provided
      if (specifications !== undefined) {
        if (specifications.length > 0) {
          // Update specifications using upsert
          await this.prisma.product.update({
            where: { id },
            data: {
              specifications: {
                deleteMany: {
                  name: {
                    notIn: specifications.map((spec) => spec.name),
                  },
                },
                upsert: specifications.map((spec) => ({
                  where: {
                    productId_name: {
                      productId: id,
                      name: spec.name,
                    },
                  },
                  update: {
                    value: spec.value,
                  },
                  create: {
                    name: spec.name,
                    value: spec.value,
                  },
                })),
              },
            },
          });
        } else {
          // If empty array is sent, remove all specifications
          await this.prisma.specification.deleteMany({
            where: { productId: id },
          });
        }

        // Return updated product with specifications
        return await this.prisma.product.findUnique({
          where: { id },
          include: { specifications: true },
        });
      }

      return updatedProduct;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Product with ID #${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const deletedProduct = await this.prisma.product.delete({
        where: { id },
        include: { specifications: true },
      });

      return deletedProduct;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Product with ID #${id} not found`);
      }
      throw error;
    }
  }
}
