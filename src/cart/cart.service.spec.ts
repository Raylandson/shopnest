import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { CartItemDto } from './dto/cart-item.dto';
import { CartWithProducts } from '../common/interfaces/cart-with-items.interface';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';

describe('CartService', () => {
  let service: CartService;
  let repository: jest.Mocked<CartRepository>;

  const mockCart = {
    id: 1,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    cartItems: [],
  };

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
    ...mockCart,
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

  beforeEach(async () => {
    const mockCartRepository = {
      findCartByUserId: jest.fn(),
      createCart: jest.fn(),
      findCartItem: jest.fn(),
      updateCartItemQuantity: jest.fn(),
      createCartItem: jest.fn(),
      deleteCartItem: jest.fn(),
      findCartItemById: jest.fn(),
      findCartWithItemsByUserId: jest.fn(),
      clearCart: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: CartRepository,
          useValue: mockCartRepository,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    repository = module.get<CartRepository>(
      CartRepository,
    ) as jest.Mocked<CartRepository>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateItemQuantity', () => {
    it('should update existing item quantity when item exists', async () => {
      const existingItem = { ...mockCartItem, quantity: 1 };
      const updatedItem = { ...mockCartItem, quantity: 3 };

      repository.findCartByUserId.mockResolvedValue(mockCart);
      repository.findCartItem.mockResolvedValue(existingItem);
      repository.updateCartItemQuantity.mockResolvedValue(updatedItem);

      const result = await service.updateItemQuantity(mockCartItemDto, 1);

      expect(result).toEqual(updatedItem);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findCartByUserId).toHaveBeenCalledWith(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findCartItem).toHaveBeenCalledWith(1, 1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.updateCartItemQuantity).toHaveBeenCalledWith(1, 3);
    });

    it('should remove item when quantity becomes zero or negative', async () => {
      const existingItem = { ...mockCartItem, quantity: 1 };

      repository.findCartByUserId.mockResolvedValue(mockCart);
      repository.findCartItem.mockResolvedValue(existingItem);
      repository.deleteCartItem.mockResolvedValue(existingItem);

      const cartItemDtoWithNegativeQuantity = { productId: 1, quantity: -2 };
      const result = await service.updateItemQuantity(
        cartItemDtoWithNegativeQuantity,
        1,
      );

      expect(result).toBeNull();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.deleteCartItem).toHaveBeenCalledWith(1);
    });

    it('should create new item when item does not exist', async () => {
      const newItem = mockCartItem;

      repository.findCartByUserId.mockResolvedValue(mockCart);
      repository.findCartItem.mockResolvedValue(null);
      repository.createCartItem.mockResolvedValue(newItem);

      const result = await service.updateItemQuantity(mockCartItemDto, 1);

      expect(result).toEqual(newItem);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.createCartItem).toHaveBeenCalledWith(
        mockCartItemDto,
        1,
      );
    });

    it('should create cart if user does not have one', async () => {
      const newCart = { ...mockCart, cartItems: [] };

      repository.findCartByUserId.mockResolvedValue(null);
      repository.createCart.mockResolvedValue(newCart);
      repository.findCartItem.mockResolvedValue(null);
      repository.createCartItem.mockResolvedValue(mockCartItem);

      const result = await service.updateItemQuantity(mockCartItemDto, 1);

      expect(result).toEqual(mockCartItem);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.createCart).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when product does not exist (P2025)', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record to delete does not exist',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );

      repository.findCartByUserId.mockResolvedValue(mockCart);
      repository.findCartItem.mockResolvedValue(null);
      repository.createCartItem.mockRejectedValue(prismaError);

      await expect(
        service.updateItemQuantity(mockCartItemDto, 1),
      ).rejects.toThrow(
        new NotFoundException(
          `Product with ID #${mockCartItemDto.productId} not found`,
        ),
      );
    });

    it('should throw NotFoundException when foreign key constraint fails (P2003)', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '4.0.0',
        },
      );

      repository.findCartByUserId.mockResolvedValue(mockCart);
      repository.findCartItem.mockResolvedValue(null);
      repository.createCartItem.mockRejectedValue(prismaError);

      await expect(
        service.updateItemQuantity(mockCartItemDto, 1),
      ).rejects.toThrow(
        new NotFoundException(
          `Product with ID #${mockCartItemDto.productId} not found`,
        ),
      );
    });

    it('should throw NotFoundException when required relation missing (P2026)', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Required relation missing',
        {
          code: 'P2026',
          clientVersion: '4.0.0',
        },
      );

      repository.findCartByUserId.mockResolvedValue(mockCart);
      repository.findCartItem.mockResolvedValue(null);
      repository.createCartItem.mockRejectedValue(prismaError);

      await expect(
        service.updateItemQuantity(mockCartItemDto, 1),
      ).rejects.toThrow(
        new NotFoundException(
          `Product with ID #${mockCartItemDto.productId} not found`,
        ),
      );
    });

    it('should re-throw other Prisma errors', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Some other error',
        {
          code: 'P2001',
          clientVersion: '4.0.0',
        },
      );

      repository.findCartByUserId.mockResolvedValue(mockCart);
      repository.findCartItem.mockResolvedValue(null);
      repository.createCartItem.mockRejectedValue(prismaError);

      await expect(
        service.updateItemQuantity(mockCartItemDto, 1),
      ).rejects.toThrow(prismaError);
    });

    it('should re-throw non-Prisma errors', async () => {
      const genericError = new Error('Database connection failed');

      repository.findCartByUserId.mockResolvedValue(mockCart);
      repository.findCartItem.mockResolvedValue(null);
      repository.createCartItem.mockRejectedValue(genericError);

      await expect(
        service.updateItemQuantity(mockCartItemDto, 1),
      ).rejects.toThrow(genericError);
    });
  });

  describe('removeItem', () => {
    it('should remove item successfully when it exists', async () => {
      const cartItemToDelete = mockCartItem;

      repository.findCartItemById.mockResolvedValue(cartItemToDelete);
      repository.deleteCartItem.mockResolvedValue(cartItemToDelete);

      const result = await service.removeItem(1, 1);

      expect(result).toEqual(cartItemToDelete);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findCartItemById).toHaveBeenCalledWith(1, 1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.deleteCartItem).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when cart item does not exist in user cart', async () => {
      repository.findCartItemById.mockResolvedValue(null);

      await expect(service.removeItem(999, 1)).rejects.toThrow(
        new NotFoundException(`Cart item with ID #999 not found in your cart`),
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.deleteCartItem).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when deleteCartItem returns null', async () => {
      const cartItemToDelete = mockCartItem;

      repository.findCartItemById.mockResolvedValue(cartItemToDelete);
      (repository.deleteCartItem as jest.Mock).mockResolvedValue(null);

      await expect(service.removeItem(1, 1)).rejects.toThrow(
        new NotFoundException(`Cart item with ID #1 not found`),
      );
    });
  });

  describe('findCartWithItemsByUserId', () => {
    it('should return cart with products for valid user', async () => {
      repository.findCartWithItemsByUserId.mockResolvedValue(
        mockCartWithProducts,
      );

      const result = await service.findCartWithItemsByUserId(1);

      expect(result).toEqual(mockCartWithProducts);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findCartWithItemsByUserId).toHaveBeenCalledWith(1);
    });

    it('should return null when user has no cart', async () => {
      repository.findCartWithItemsByUserId.mockResolvedValue(null);

      const result = await service.findCartWithItemsByUserId(999);

      expect(result).toBeNull();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findCartWithItemsByUserId).toHaveBeenCalledWith(999);
    });
  });

  describe('getAllCartItemsByUserId', () => {
    it('should return cart with products for valid user', async () => {
      repository.findCartWithItemsByUserId.mockResolvedValue(
        mockCartWithProducts,
      );

      const result = await service.getAllCartItemsByUserId(1);

      expect(result).toEqual(mockCartWithProducts);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findCartWithItemsByUserId).toHaveBeenCalledWith(1);
    });

    it('should return null when user has no cart', async () => {
      repository.findCartWithItemsByUserId.mockResolvedValue(null);

      const result = await service.getAllCartItemsByUserId(999);

      expect(result).toBeNull();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findCartWithItemsByUserId).toHaveBeenCalledWith(999);
    });
  });

  describe('clearCart', () => {
    it('should clear cart successfully', async () => {
      repository.clearCart.mockResolvedValue();

      await service.clearCart(1);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.clearCart).toHaveBeenCalledWith(1);
    });

    it('should handle clearing non-existent cart without error', async () => {
      repository.clearCart.mockResolvedValue();

      await expect(service.clearCart(999)).resolves.toBeUndefined();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.clearCart).toHaveBeenCalledWith(999);
    });
  });

  describe('handleCart (private method testing via public methods)', () => {
    it('should return existing cart when user has one', async () => {
      repository.findCartByUserId.mockResolvedValue(mockCart);
      repository.findCartItem.mockResolvedValue(null);
      repository.createCartItem.mockResolvedValue(mockCartItem);

      await service.updateItemQuantity(mockCartItemDto, 1);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findCartByUserId).toHaveBeenCalledWith(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.createCart).not.toHaveBeenCalled();
    });

    it('should create new cart when user does not have one', async () => {
      const newCart = { ...mockCart, cartItems: [] };

      repository.findCartByUserId.mockResolvedValue(null);
      repository.createCart.mockResolvedValue(newCart);
      repository.findCartItem.mockResolvedValue(null);
      repository.createCartItem.mockResolvedValue(mockCartItem);

      await service.updateItemQuantity(mockCartItemDto, 1);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findCartByUserId).toHaveBeenCalledWith(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.createCart).toHaveBeenCalledWith(1);
    });
  });
});
