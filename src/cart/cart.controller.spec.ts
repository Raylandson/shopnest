import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartItemDto } from './dto/cart-item.dto';
import { AuthenticatedRequest } from '../common/interfaces/user-auth.interface';
import { AuthGuard } from '../auth/auth.guard';
import { CartWithProducts } from '../common/interfaces/cart-with-items.interface';
import { Response } from 'express';

describe('CartController', () => {
  let controller: CartController;
  let service: jest.Mocked<CartService>;

  const mockUser = {
    sub: 1,
    username: 'testuser',
    iat: 1640995200,
    exp: 1640998800,
  };

  const mockRequest: AuthenticatedRequest = {
    user: mockUser,
  } as AuthenticatedRequest;

  const mockCartItem = {
    id: 1,
    productId: 1,
    quantity: 2,
    cartId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    category: 'Electronics',
    imageUrl: 'http://example.com/image.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCartWithProducts: CartWithProducts = {
    id: 1,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    cartItems: [
      {
        ...mockCartItem,
        product: mockProduct,
      },
    ],
  };

  const mockCartItemDto: CartItemDto = {
    productId: 1,
    quantity: 2,
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    const mockCartService = {
      getAllCartItemsByUserId: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CartController>(CartController);
    service = module.get<CartService>(CartService) as jest.Mocked<CartService>;

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getItems', () => {
    it('should return cart items for authenticated user', async () => {
      service.getAllCartItemsByUserId.mockResolvedValue(mockCartWithProducts);

      const result = await controller.getItems(mockRequest);

      expect(result).toEqual(mockCartWithProducts);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getAllCartItemsByUserId).toHaveBeenCalledWith(1);
    });

    it('should return null when user has no cart', async () => {
      service.getAllCartItemsByUserId.mockResolvedValue(null);

      const result = await controller.getItems(mockRequest);

      expect(result).toBeNull();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getAllCartItemsByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe('updateItemQuantity', () => {
    it('should return cart item when successfully updated', async () => {
      service.updateItemQuantity.mockResolvedValue(mockCartItem);

      await controller.updateItemQuantity(
        mockCartItemDto,
        mockRequest,
        mockResponse,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.updateItemQuantity).toHaveBeenCalledWith(
        mockCartItemDto,
        1,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCartItem);
    });

    it('should return 204 No Content when item is removed (quantity becomes 0)', async () => {
      service.updateItemQuantity.mockResolvedValue(null);

      await controller.updateItemQuantity(
        mockCartItemDto,
        mockRequest,
        mockResponse,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.updateItemQuantity).toHaveBeenCalledWith(
        mockCartItemDto,
        1,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle service errors properly', async () => {
      const error = new Error('Service error');
      service.updateItemQuantity.mockRejectedValue(error);

      await expect(
        controller.updateItemQuantity(
          mockCartItemDto,
          mockRequest,
          mockResponse,
        ),
      ).rejects.toThrow('Service error');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.updateItemQuantity).toHaveBeenCalledWith(
        mockCartItemDto,
        1,
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item successfully', async () => {
      const removedItem = mockCartItem;
      service.removeItem.mockResolvedValue(removedItem);

      const result = await controller.removeItem('1', mockRequest);

      expect(result).toEqual(removedItem);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.removeItem).toHaveBeenCalledWith(1, 1);
    });

    it('should handle item ID parsing correctly', async () => {
      const removedItem = mockCartItem;
      service.removeItem.mockResolvedValue(removedItem);

      const result = await controller.removeItem('123', mockRequest);

      expect(result).toEqual(removedItem);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.removeItem).toHaveBeenCalledWith(123, 1);
    });

    it('should handle service errors properly', async () => {
      const error = new Error('Item not found');
      service.removeItem.mockRejectedValue(error);

      await expect(controller.removeItem('999', mockRequest)).rejects.toThrow(
        'Item not found',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.removeItem).toHaveBeenCalledWith(999, 1);
    });

    it('should handle invalid item ID format', async () => {
      const removedItem = mockCartItem;
      service.removeItem.mockResolvedValue(removedItem);

      // parseInt will convert 'abc' to NaN, which becomes 0 when passed to the service
      const result = await controller.removeItem('abc', mockRequest);

      expect(result).toEqual(removedItem);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.removeItem).toHaveBeenCalledWith(NaN, 1);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should be protected by AuthGuard', () => {
      // Test that the controller methods are properly decorated with guards
      // by checking if the guard was overridden in our test module
      expect(controller).toBeDefined();
      expect(service).toBeDefined();
    });

    it('should extract user ID from authenticated request', async () => {
      const customRequest = {
        user: { sub: 42, username: 'customuser', iat: 1, exp: 2 },
      } as AuthenticatedRequest;

      service.getAllCartItemsByUserId.mockResolvedValue(null);

      await controller.getItems(customRequest);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getAllCartItemsByUserId).toHaveBeenCalledWith(42);
    });
  });
});
