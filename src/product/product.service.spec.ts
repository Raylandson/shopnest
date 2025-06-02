import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';

describe('ProductService', () => {
  let service: ProductService;
  let repository: jest.Mocked<ProductRepository>;

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    category: 'Electronics',
    imageUrl: 'http://example.com/image.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    specifications: [
      {
        id: 1,
        name: 'Color',
        value: 'Blue',
        productId: 1,
      },
    ],
  };

  const mockCreateProductDto: CreateProductDto = {
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    category: 'Electronics',
    imageUrl: 'http://example.com/image.jpg',
    specifications: [
      {
        name: 'Color',
        value: 'Blue',
      },
    ],
  };

  const mockUpdateProductDto: UpdateProductDto = {
    name: 'Updated Product',
    price: 149.99,
  };

  const mockSearchDto: SearchProductDto = {
    name: 'Test',
    category: 'Electronics',
    minPrice: 50,
    maxPrice: 200,
  };

  beforeEach(async () => {
    const mockProductRepository = {
      search: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get<ProductRepository>(
      ProductRepository,
    ) as jest.Mocked<ProductRepository>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return search results from repository', async () => {
      const expectedResult = [mockProduct];
      repository.search.mockResolvedValue(expectedResult);

      const result = await service.search(mockSearchDto);

      expect(result).toEqual(expectedResult);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.search).toHaveBeenCalledWith(mockSearchDto);
    });

    it('should return empty array when no products match search criteria', async () => {
      repository.search.mockResolvedValue([]);

      const result = await service.search(mockSearchDto);

      expect(result).toEqual([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.search).toHaveBeenCalledWith(mockSearchDto);
    });
  });

  describe('create', () => {
    it('should create and return a product successfully', async () => {
      repository.create.mockResolvedValue(mockProduct);

      const result = await service.create(mockCreateProductDto);

      expect(result).toEqual(mockProduct);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.create).toHaveBeenCalledWith(mockCreateProductDto);
    });

    it('should throw ConflictException when product name already exists', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['name'] },
        },
      );
      repository.create.mockRejectedValue(prismaError);

      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        new ConflictException(
          `Product with name '${mockCreateProductDto.name}' already exists.`,
        ),
      );
    });

    it('should throw ConflictException when duplicate specification name exists', async () => {
      const createDtoWithDuplicateSpecs: CreateProductDto = {
        ...mockCreateProductDto,
        specifications: [
          { name: 'Color', value: 'Blue' },
          { name: 'Color', value: 'Red' },
        ],
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['productId', 'name'] },
        },
      );
      repository.create.mockRejectedValue(prismaError);

      await expect(service.create(createDtoWithDuplicateSpecs)).rejects.toThrow(
        new ConflictException(
          `Duplicate specification name 'Color' for product '${createDtoWithDuplicateSpecs.name}'.`,
        ),
      );
    });

    it('should throw ConflictException for unknown constraint violation', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['unknown_field'] },
        },
      );
      repository.create.mockRejectedValue(prismaError);

      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw non-Prisma errors', async () => {
      const genericError = new Error('Database connection failed');
      repository.create.mockRejectedValue(genericError);

      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        genericError,
      );
    });
  });

  describe('findAll', () => {
    it('should return all products from repository', async () => {
      const expectedResult = [mockProduct];
      repository.findAll.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no products exist', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product when it exists', async () => {
      repository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(1);

      expect(result).toEqual(mockProduct);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Product with id 999 not found'),
      );
    });
  });

  describe('update', () => {
    const updatedProduct = {
      ...mockProduct,
      ...mockUpdateProductDto,
      specifications: mockProduct.specifications, // Keep the original specifications with id and productId
    };

    it('should update and return a product successfully', async () => {
      repository.update.mockResolvedValue(updatedProduct);

      const result = await service.update(1, mockUpdateProductDto);

      expect(result).toEqual(updatedProduct);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.update).toHaveBeenCalledWith(1, mockUpdateProductDto);
    });

    it('should throw NotFoundException when product to update does not exist', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record to update not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );
      repository.update.mockRejectedValue(prismaError);

      await expect(service.update(999, mockUpdateProductDto)).rejects.toThrow(
        new NotFoundException('Product with ID #999 not found'),
      );
    });

    it('should throw ConflictException when updated product name already exists', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['name'] },
        },
      );
      repository.update.mockRejectedValue(prismaError);

      await expect(service.update(1, mockUpdateProductDto)).rejects.toThrow(
        new ConflictException(
          `Product with name '${mockUpdateProductDto.name}' already exists.`,
        ),
      );
    });

    it('should throw ConflictException when updated specifications have duplicate names', async () => {
      const updateDtoWithSpecs: UpdateProductDto = {
        ...mockUpdateProductDto,
        specifications: [
          { name: 'Size', value: 'Large' },
          { name: 'Size', value: 'Medium' },
        ],
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['productId', 'name'] },
        },
      );
      repository.update.mockRejectedValue(prismaError);

      await expect(service.update(1, updateDtoWithSpecs)).rejects.toThrow(
        new ConflictException(
          `Duplicate specification name 'Size' for product '${updateDtoWithSpecs.name}'.`,
        ),
      );
    });

    it('should re-throw non-Prisma errors', async () => {
      const genericError = new Error('Database connection failed');
      repository.update.mockRejectedValue(genericError);

      await expect(service.update(1, mockUpdateProductDto)).rejects.toThrow(
        genericError,
      );
    });
  });

  describe('remove', () => {
    it('should remove and return a product successfully', async () => {
      repository.remove.mockResolvedValue(mockProduct);

      const result = await service.remove(1);

      expect(result).toEqual(mockProduct);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when product to remove does not exist', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record to delete does not exist',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );
      repository.remove.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Product with ID #999 not found'),
      );
    });

    it('should re-throw non-Prisma errors', async () => {
      const genericError = new Error('Database connection failed');
      repository.remove.mockRejectedValue(genericError);

      await expect(service.remove(1)).rejects.toThrow(genericError);
    });
  });

  describe('handlePrismaError2022 (private method testing via public methods)', () => {
    it('should handle product name constraint with string target', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: 'product_name_unique' },
        },
      );
      repository.create.mockRejectedValue(prismaError);

      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        new ConflictException(
          `Product with name '${mockCreateProductDto.name}' already exists.`,
        ),
      );
    });

    it('should handle specification constraint with string target', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: 'specification_productid_name_unique' },
        },
      );
      repository.create.mockRejectedValue(prismaError);

      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should handle unknown constraint target gracefully', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: null },
        },
      );
      repository.create.mockRejectedValue(prismaError);

      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        new ConflictException('Unknown constraint violation.'),
      );
    });

    it('should detect duplicate specification names in array', async () => {
      const createDtoWithMultipleDuplicates: CreateProductDto = {
        ...mockCreateProductDto,
        specifications: [
          { name: 'Color', value: 'Blue' },
          { name: 'Size', value: 'Large' },
          { name: 'Color', value: 'Red' },
          { name: 'Weight', value: '2kg' },
        ],
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['productId', 'name'] },
        },
      );
      repository.create.mockRejectedValue(prismaError);

      await expect(
        service.create(createDtoWithMultipleDuplicates),
      ).rejects.toThrow(
        new ConflictException(
          `Duplicate specification name 'Color' for product '${createDtoWithMultipleDuplicates.name}'.`,
        ),
      );
    });

    it('should handle specification constraint when no duplicates found in local array', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['productId', 'name'] },
        },
      );
      repository.create.mockRejectedValue(prismaError);

      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        new ConflictException(
          `A unique specification name conflict occurred for product '${mockCreateProductDto.name}'. Please ensure all specification names are unique for this product.`,
        ),
      );
    });
  });
});
