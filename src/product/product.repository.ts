import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

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
    try {
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
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target as string[] | string | undefined;

        if (
          (typeof target === 'string' &&
            target.toLowerCase().includes('product_name')) ||
          (Array.isArray(target) && target.length === 1 && target[0] === 'name')
        ) {
          throw new ConflictException(
            `Product with name '${createProductDto.name}' already exists.`,
          );
        } else if (
          (typeof target === 'string' &&
            target.toLowerCase().includes('specification_productid_name')) ||
          (Array.isArray(target) &&
            target.length === 2 &&
            target.includes('productId') &&
            target.includes('name'))
        ) {
          const specNames =
            createProductDto.specifications?.map((s) => s.name) || [];
          const counts: Record<string, number> = {};
          let duplicateSpecName: string | undefined;

          for (const name of specNames) {
            counts[name] = (counts[name] || 0) + 1;
            if (counts[name] > 1) {
              duplicateSpecName = name;
              break;
            }
          }

          if (duplicateSpecName) {
            throw new ConflictException(
              `Duplicate specification name '${duplicateSpecName}' for product '${createProductDto.name}'.`,
            );
          } else {
            throw new ConflictException(
              `A unique specification name conflict occurred for product '${createProductDto.name}'. Please ensure all specification names are unique for this product.`,
            );
          }
        } else {
          throw new ConflictException(
            `A unique constraint violation occurred. Target: ${target ? JSON.stringify(target) : 'unknown'}. Please check your input.`,
          );
        }
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.product.findMany({
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
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
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
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID #${id} not found`);
        }
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[] | undefined;
          if (
            target &&
            target.includes('name') &&
            error.message.includes('Product')
          ) {
            throw new ConflictException(
              `Product name '${updateProductDto.name}' already exists.`,
            );
          }
          throw new ConflictException(
            `A unique constraint was violated. Fields: ${target?.join(', ')}`,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.product.delete({
        where: { id },
        include: { specifications: true },
      });
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
