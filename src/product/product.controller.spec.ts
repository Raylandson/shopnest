import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('ProductController', () => {
  let controller: ProductController;
  let service: jest.Mocked<ProductService>;

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
    const mockProductService = {
      create: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(
      ProductService,
    ) as jest.Mocked<ProductService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a product successfully', async () => {
      service.create.mockResolvedValue(mockProduct);

      const result = await controller.create(mockCreateProductDto);

      expect(result).toEqual(mockProduct);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.create).toHaveBeenCalledWith(mockCreateProductDto);
    });

    it('should throw Error when product creation returns null/undefined', async () => {
      // Type assertion to handle test scenario where service returns falsy value
      (service.create as jest.Mock).mockResolvedValue(undefined);

      await expect(controller.create(mockCreateProductDto)).rejects.toThrow(
        new Error('Product creation failed'),
      );
    });

    it('should propagate ConflictException from service', async () => {
      const conflictError = new ConflictException(
        `Product with name '${mockCreateProductDto.name}' already exists.`,
      );
      service.create.mockRejectedValue(conflictError);

      await expect(controller.create(mockCreateProductDto)).rejects.toThrow(
        conflictError,
      );
    });

    it('should propagate other errors from service', async () => {
      const genericError = new Error('Database connection failed');
      service.create.mockRejectedValue(genericError);

      await expect(controller.create(mockCreateProductDto)).rejects.toThrow(
        genericError,
      );
    });
  });

  describe('findAll', () => {
    it('should return all products when no query parameters provided', async () => {
      const expectedResult = [mockProduct];
      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll({});

      expect(result).toEqual(expectedResult);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.search).not.toHaveBeenCalled();
    });

    it('should call search when query parameters are provided', async () => {
      const expectedResult = [mockProduct];
      service.search.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockSearchDto);

      expect(result).toEqual(expectedResult);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.search).toHaveBeenCalledWith(mockSearchDto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should call search when partial query parameters are provided', async () => {
      const partialSearchDto = { name: 'Test' };
      const expectedResult = [mockProduct];
      service.search.mockResolvedValue(expectedResult);

      const result = await controller.findAll(partialSearchDto);

      expect(result).toEqual(expectedResult);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.search).toHaveBeenCalledWith(partialSearchDto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should return empty array when no products found', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll({});

      expect(result).toEqual([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product when it exists', async () => {
      service.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockProduct);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException from service', async () => {
      const notFoundError = new NotFoundException(
        'Product with id 999 not found',
      );
      service.findOne.mockRejectedValue(notFoundError);

      await expect(controller.findOne(999)).rejects.toThrow(notFoundError);
    });

    it('should propagate other errors from service', async () => {
      const genericError = new Error('Database connection failed');
      service.findOne.mockRejectedValue(genericError);

      await expect(controller.findOne(1)).rejects.toThrow(genericError);
    });
  });

  describe('update', () => {
    const updatedProduct = {
      ...mockProduct,
      ...mockUpdateProductDto,
      specifications: mockProduct.specifications,
    };

    it('should update and return a product successfully', async () => {
      service.update.mockResolvedValue(updatedProduct);

      const result = await controller.update(1, mockUpdateProductDto);

      expect(result).toEqual(updatedProduct);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.update).toHaveBeenCalledWith(1, mockUpdateProductDto);
    });

    it('should propagate NotFoundException when product does not exist', async () => {
      const notFoundError = new NotFoundException(
        'Product with ID #999 not found',
      );
      service.update.mockRejectedValue(notFoundError);

      await expect(
        controller.update(999, mockUpdateProductDto),
      ).rejects.toThrow(notFoundError);
    });

    it('should propagate ConflictException when update violates constraints', async () => {
      const conflictError = new ConflictException(
        `Product with name '${mockUpdateProductDto.name}' already exists.`,
      );
      service.update.mockRejectedValue(conflictError);

      await expect(controller.update(1, mockUpdateProductDto)).rejects.toThrow(
        conflictError,
      );
    });

    it('should propagate other errors from service', async () => {
      const genericError = new Error('Database connection failed');
      service.update.mockRejectedValue(genericError);

      await expect(controller.update(1, mockUpdateProductDto)).rejects.toThrow(
        genericError,
      );
    });
  });

  describe('remove', () => {
    it('should remove and return a product successfully', async () => {
      service.remove.mockResolvedValue(mockProduct);

      const result = await controller.remove(1);

      expect(result).toEqual(mockProduct);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException when product does not exist', async () => {
      const notFoundError = new NotFoundException(
        'Product with ID #999 not found',
      );
      service.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove(999)).rejects.toThrow(notFoundError);
    });

    it('should propagate other errors from service', async () => {
      const genericError = new Error('Database connection failed');
      service.remove.mockRejectedValue(genericError);

      await expect(controller.remove(1)).rejects.toThrow(genericError);
    });
  });

  describe('findAll method logic', () => {
    it('should determine empty object has no keys and call findAll', async () => {
      const emptySearchDto = {};
      service.findAll.mockResolvedValue([mockProduct]);

      await controller.findAll(emptySearchDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.search).not.toHaveBeenCalled();
    });

    it('should determine object with undefined values has keys and call search', async () => {
      const searchDtoWithUndefined = {
        name: undefined,
        category: 'Electronics',
      };
      service.search.mockResolvedValue([mockProduct]);

      await controller.findAll(searchDtoWithUndefined);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.search).toHaveBeenCalledWith(searchDtoWithUndefined);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should handle multiple search parameters correctly', async () => {
      const multipleParamsSearch = {
        name: 'Test',
        category: 'Electronics',
        minPrice: 50,
        maxPrice: 200,
        description: 'Test description',
      };
      service.search.mockResolvedValue([mockProduct]);

      await controller.findAll(multipleParamsSearch);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.search).toHaveBeenCalledWith(multipleParamsSearch);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).not.toHaveBeenCalled();
    });
  });
});
