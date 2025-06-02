import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/user-auth.interface';
import { NotFoundException } from '@nestjs/common';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<OrdersService>;

  const mockUser = {
    sub: 1,
    username: 'testuser',
    iat: 1234567890,
    exp: 9999999999,
  };

  const mockAuthenticatedRequest: AuthenticatedRequest = {
    user: mockUser,
  } as AuthenticatedRequest;

  const mockOrder = {
    id: 1,
    userId: 1,
    totalAmount: 199.98,
    isConfirmed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    orderItems: [
      {
        id: 1,
        orderId: 1,
        productId: 1,
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockOrders = [mockOrder];

  beforeEach(async () => {
    const mockOrdersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      confirmOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get<OrdersService>(
      OrdersService,
    ) as jest.Mocked<OrdersService>;

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create order successfully', async () => {
      ordersService.create.mockResolvedValue(mockOrder);

      const result = await controller.create(mockAuthenticatedRequest);

      expect(result).toEqual(mockOrder);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.create).toHaveBeenCalledWith(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.create).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors when creating order', async () => {
      const error = new NotFoundException('Cart not found for user ID: 1.');
      ordersService.create.mockRejectedValue(error);

      await expect(controller.create(mockAuthenticatedRequest)).rejects.toThrow(
        NotFoundException,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.create).toHaveBeenCalledWith(1);
    });

    it('should use correct user ID from authenticated request', async () => {
      const customRequest: AuthenticatedRequest = {
        user: { ...mockUser, sub: 999 },
      } as AuthenticatedRequest;
      ordersService.create.mockResolvedValue(mockOrder);

      await controller.create(customRequest);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.create).toHaveBeenCalledWith(999);
    });
  });

  describe('findAll', () => {
    it('should return all orders for authenticated user', async () => {
      ordersService.findAll.mockResolvedValue(mockOrders);

      const result = await controller.findAll(mockAuthenticatedRequest);

      expect(result).toEqual(mockOrders);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.findAll).toHaveBeenCalledWith(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when user has no orders', async () => {
      ordersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockAuthenticatedRequest);

      expect(result).toEqual([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.findAll).toHaveBeenCalledWith(1);
    });

    it('should use correct user ID from authenticated request', async () => {
      const customRequest: AuthenticatedRequest = {
        user: { ...mockUser, sub: 777 },
      } as AuthenticatedRequest;
      ordersService.findAll.mockResolvedValue([]);

      await controller.findAll(customRequest);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.findAll).toHaveBeenCalledWith(777);
    });
  });
});
