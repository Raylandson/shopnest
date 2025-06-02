import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';

@Injectable()
export class ProductRepository {
  constructor(private prisma: PrismaService) {}

  async search(searchDto: SearchProductDto) {
    const { name, category, description, minPrice, maxPrice } = searchDto;

    return this.prisma.product.findMany({
      where: {
        ...(name && {
          name: {
            contains: name,
          },
        }),
        ...(category && {
          category: {
            contains: category,
          },
        }),
        ...(description && {
          description: {
            contains: description,
          },
        }),
        ...((minPrice || maxPrice) && {
          price: {
            ...(minPrice && { gte: minPrice }),
            ...(maxPrice && { lte: maxPrice }),
          },
        }),
      },
      include: {
        specifications: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

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
    return this.prisma.product.findMany({
      include: {
        specifications: true,
      },
    });
  }

  async findOne(id: number) {
    return await this.prisma.product.findUnique({
      where: { id },
      include: { specifications: true },
    });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { specifications, ...productData } = updateProductDto;

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: productData,
      include: { specifications: true },
    });

    if (specifications !== undefined) {
      await this.prisma.specification.deleteMany({
        where: {
          productId: id,
          NOT:
            specifications.length > 0
              ? specifications.map((spec) => ({ name: spec.name }))
              : undefined,
        },
      });

      if (specifications.length > 0) {
        for (const spec of specifications) {
          await this.prisma.specification.upsert({
            where: {
              productId_name: {
                productId: id,
                name: spec.name,
              },
            },
            update: { value: spec.value },
            create: {
              productId: id,
              name: spec.name,
              value: spec.value,
            },
          });
        }
      }
      return this.prisma.product.findUnique({
        where: { id },
        include: { specifications: true },
      });
    }

    return updatedProduct;
  }

  async remove(id: number) {
    return await this.prisma.product.delete({
      where: { id },
      include: { specifications: true },
    });
  }
}
