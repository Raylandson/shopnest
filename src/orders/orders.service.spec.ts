import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { CartService } from '../cart/cart.service';
import { CartWithProducts } from '../common/interfaces/cart-with-items.interface';

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: jest.Mocked<OrdersRepository>;
  let cartService: jest.Mocked<CartService>;

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

  const mockCartItem = {
    id: 1,
    productId: 1,
    quantity: 2,
    cartId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: mockProduct,
  };

  const mockCartWithProducts: CartWithProducts = {
    id: 1,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    cartItems: [mockCartItem],
  };

  const mockOrderItem = {
    id: 1,
    orderId: 1,
    productId: 1,
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder = {
    id: 1,
    userId: 1,
    totalAmount: 199.98,
    isConfirmed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    orderItems: [mockOrderItem],
  };

  const mockConfirmedOrder = {
    ...mockOrder,
    isConfirmed: true,
  };

  beforeEach(async () => {
    const mockOrdersRepository = {
      createOrder: jest.fn(),
      findOrderById: jest.fn(),
      updateOrder: jest.fn(),
      findAll: jest.fn(),
    };

    const mockCartService = {
      findCartWithItemsByUserId: jest.fn(),
      clearCart: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: mockOrdersRepository,
        },
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    ordersRepository = module.get<OrdersRepository>(
      OrdersRepository,
    ) as jest.Mocked<OrdersRepository>;
    cartService = module.get<CartService>(
      CartService,
    ) as jest.Mocked<CartService>;

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create order successfully with valid cart', async () => {
      cartService.findCartWithItemsByUserId.mockResolvedValue(
        mockCartWithProducts,
      );
      ordersRepository.createOrder.mockResolvedValue(mockOrder);
      cartService.clearCart.mockResolvedValue();

      const result = await service.create(1);

      expect(result).toEqual(mockOrder);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(cartService.findCartWithItemsByUserId).toHaveBeenCalledWith(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersRepository.createOrder).toHaveBeenCalledWith(1, 199.98, [
        { productId: 1, quantity: 2 },
      ]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(cartService.clearCart).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when cart is not found', async () => {
      cartService.findCartWithItemsByUserId.mockResolvedValue(null);

      await expect(service.create(1)).rejects.toThrow(
        new NotFoundException('Cart not found for user ID: 1.'),
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(cartService.findCartWithItemsByUserId).toHaveBeenCalledWith(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersRepository.createOrder).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(cartService.clearCart).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when cart is empty', async () => {
      const emptyCart = { ...mockCartWithProducts, cartItems: [] };
      cartService.findCartWithItemsByUserId.mockResolvedValue(emptyCart);

      await expect(service.create(1)).rejects.toThrow(
        new NotFoundException('Cannot create order from an empty cart.'),
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(cartService.findCartWithItemsByUserId).toHaveBeenCalledWith(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersRepository.createOrder).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(cartService.clearCart).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when total amount is zero', async () => {
      const cartWithZeroPrice = {
        ...mockCartWithProducts,
        cartItems: [
          {
            ...mockCartItem,
            product: { ...mockProduct, price: 0 },
          },
        ],
      };
      cartService.findCartWithItemsByUserId.mockResolvedValue(
        cartWithZeroPrice,
      );

      await expect(service.create(1)).rejects.toThrow(
        new NotFoundException(
          'Cannot create order with zero or negative total amount. Check product prices and quantities.',
        ),
      );
    });

    it('should handle cart items with null products', async () => {
      const cartWithNullProduct = {
        ...mockCartWithProducts,
        cartItems: [
          {
            ...mockCartItem,
            product: null,
          },
        ],
      };
      cartService.findCartWithItemsByUserId.mockResolvedValue(
        cartWithNullProduct,
      );

      await expect(service.create(1)).rejects.toThrow(
        new NotFoundException(
          'Cannot create order with zero or negative total amount. Check product prices and quantities.',
        ),
      );
    });

    it('should calculate total amount correctly with multiple items', async () => {
      const multipleItemsCart = {
        ...mockCartWithProducts,
        cartItems: [
          {
            id: 1,
            productId: 1,
            quantity: 2,
            cartId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: { ...mockProduct, price: 10.0 },
          },
          {
            id: 2,
            productId: 2,
            quantity: 3,
            cartId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: { ...mockProduct, id: 2, price: 15.0 },
          },
        ],
      };
      cartService.findCartWithItemsByUserId.mockResolvedValue(
        multipleItemsCart,
      );
      ordersRepository.createOrder.mockResolvedValue(mockOrder);
      cartService.clearCart.mockResolvedValue();

      await service.create(1);

      // Total should be (2 * 10.0) + (3 * 15.0) = 20.0 + 45.0 = 65.0
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersRepository.createOrder).toHaveBeenCalledWith(1, 65.0, [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 3 },
      ]);
    });
  });

  describe('confirmOrder', () => {
    it('should confirm order successfully', async () => {
      ordersRepository.findOrderById.mockResolvedValue(mockOrder);
      ordersRepository.updateOrder.mockResolvedValue(mockConfirmedOrder);

      const result = await service.confirmOrder(1, 1);

      expect(result).toEqual(mockConfirmedOrder);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersRepository.findOrderById).toHaveBeenCalledWith(1, 1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersRepository.updateOrder).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException when order is not found', async () => {
      ordersRepository.findOrderById.mockResolvedValue(null);

      await expect(service.confirmOrder(999, 1)).rejects.toThrow(
        new NotFoundException('Order with ID #999 not found for user ID: 1.'),
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersRepository.findOrderById).toHaveBeenCalledWith(999, 1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersRepository.updateOrder).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when order is already confirmed', async () => {
      ordersRepository.findOrderById.mockResolvedValue(mockConfirmedOrder);

      await expect(service.confirmOrder(1, 1)).rejects.toThrow(
        new ConflictException('Order with ID #1 is already confirmed.'),
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersRepository.findOrderById).toHaveBeenCalledWith(1, 1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersRepository.updateOrder).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all orders for user', async () => {
      const mockOrders = [mockOrder, mockConfirmedOrder];
      ordersRepository.findAll.mockResolvedValue(mockOrders);

      const result = await service.findAll(1);

      expect(result).toEqual(mockOrders);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersRepository.findAll).toHaveBeenCalledWith(1);
    });

    it('should return empty array when user has no orders', async () => {
      ordersRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toEqual([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersRepository.findAll).toHaveBeenCalledWith(1);
    });
  });
});
