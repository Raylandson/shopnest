import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { ProductRepository } from './product.repository';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import { ProductSpecificationDto } from './dto/product-specification.dto';

@Injectable()
export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  async search(searchDto: SearchProductDto) {
    return this.productRepository.search(searchDto);
  }

  async create(createProductDto: CreateProductDto) {
    try {
      const product = await this.productRepository.create(createProductDto);
      return product;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.handlePrismaError2022(
          error,
          createProductDto.name,
          createProductDto.specifications,
        );
      }

      throw error;
    }
  }

  async findAll() {
    return this.productRepository.findAll();
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne(id);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      return await this.productRepository.update(id, updateProductDto);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID #${id} not found`);
        }
        if (error.code === 'P2002') {
          this.handlePrismaError2022(
            error,
            updateProductDto.name,
            updateProductDto.specifications,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const removedProduct = await this.productRepository.remove(id);
      return removedProduct;
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

  private handlePrismaError2022(
    error: PrismaClientKnownRequestError,
    name: string | undefined,
    specifications: ProductSpecificationDto[] | undefined,
  ) {
    const target = error.meta?.target;
    if (typeof target !== 'string' && !Array.isArray(target)) {
      throw new ConflictException('Unknown constraint violation.');
    }

    if (
      (typeof target === 'string' &&
        target.toLowerCase().includes('product_name')) ||
      (Array.isArray(target) && target.length === 1 && target[0] === 'name')
    ) {
      throw new ConflictException(
        `Product with name '${name}' already exists.`,
      );
    } else if (
      (typeof target === 'string' &&
        target.toLowerCase().includes('specification_productid_name')) ||
      (Array.isArray(target) &&
        target.length === 2 &&
        target.includes('productId') &&
        target.includes('name'))
    ) {
      const specNames = specifications?.map((s) => s.name) || [];
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
          `Duplicate specification name '${duplicateSpecName}' for product '${name}'.`,
        );
      } else {
        throw new ConflictException(
          `A unique specification name conflict occurred for product '${name}'. Please ensure all specification names are unique for this product.`,
        );
      }
    } else {
      throw new ConflictException(
        `A unique constraint violation occurred. Target: ${target ? JSON.stringify(target) : 'unknown'}. Please check your input.`,
      );
    }
  }
}
