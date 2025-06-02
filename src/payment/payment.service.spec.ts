import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { OrdersService } from '../orders/orders.service';
import { ConfirmPaymentCard } from './dto/confirm-card-payment.dto';
import { ConfirmPixPaymentDto } from './dto/confirm-pix-payment.dto';

describe('PaymentService', () => {
  let service: PaymentService;
  let ordersService: jest.Mocked<OrdersService>;

  const mockConfirmedOrder = {
    id: 1,
    userId: 1,
    totalAmount: 199.98,
    isConfirmed: true,
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

  const mockCreditCardPayment: ConfirmPaymentCard = {
    orderId: 1,
    cardNumber: '1234567890123456',
    cardHolderName: 'John Doe',
    expirationDate: '12/25',
    cvv: '123',
  };

  const mockPixPayment: ConfirmPixPaymentDto = {
    orderId: 1,
  };

  beforeEach(async () => {
    const mockOrdersService = {
      confirmOrder: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    ordersService = module.get<OrdersService>(
      OrdersService,
    ) as jest.Mocked<OrdersService>;

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('confirmPaymentCreditCard', () => {
    it('should confirm credit card payment successfully', async () => {
      ordersService.confirmOrder.mockResolvedValue(mockConfirmedOrder);

      const result = await service.confirmPaymentCreditCard(
        mockCreditCardPayment,
        1,
      );

      expect(result).toEqual(mockConfirmedOrder);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledWith(1, 1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledTimes(1);
    });

    it('should handle different order IDs for credit card payment', async () => {
      const differentOrderPayment = { ...mockCreditCardPayment, orderId: 5 };
      ordersService.confirmOrder.mockResolvedValue({
        ...mockConfirmedOrder,
        id: 5,
      });

      const result = await service.confirmPaymentCreditCard(
        differentOrderPayment,
        2,
      );

      expect(result.id).toBe(5);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledWith(5, 2);
    });

    it('should handle different user IDs for credit card payment', async () => {
      ordersService.confirmOrder.mockResolvedValue(mockConfirmedOrder);

      await service.confirmPaymentCreditCard(mockCreditCardPayment, 3);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledWith(1, 3);
    });

    it('should propagate OrdersService errors for credit card payment', async () => {
      const error = new Error('Order confirmation failed');
      ordersService.confirmOrder.mockRejectedValue(error);

      await expect(
        service.confirmPaymentCreditCard(mockCreditCardPayment, 1),
      ).rejects.toThrow('Order confirmation failed');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledWith(1, 1);
    });

    it('should handle credit card payment with complex card data', async () => {
      const complexCardPayment: ConfirmPaymentCard = {
        orderId: 10,
        cardNumber: '4532015112830366',
        cardHolderName: 'MARIA SILVA SANTOS',
        expirationDate: '03/28',
        cvv: '456',
      };
      ordersService.confirmOrder.mockResolvedValue({
        ...mockConfirmedOrder,
        id: 10,
      });

      const result = await service.confirmPaymentCreditCard(
        complexCardPayment,
        5,
      );

      expect(result.id).toBe(10);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledWith(10, 5);
    });
  });

  describe('confirmPaymentPix', () => {
    it('should confirm PIX payment successfully', async () => {
      ordersService.confirmOrder.mockResolvedValue(mockConfirmedOrder);

      const result = await service.confirmPaymentPix(mockPixPayment, 1);

      expect(result).toEqual(mockConfirmedOrder);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledWith(1, 1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledTimes(1);
    });

    it('should handle different order IDs for PIX payment', async () => {
      const differentOrderPayment = { ...mockPixPayment, orderId: 7 };
      ordersService.confirmOrder.mockResolvedValue({
        ...mockConfirmedOrder,
        id: 7,
      });

      const result = await service.confirmPaymentPix(differentOrderPayment, 2);

      expect(result.id).toBe(7);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledWith(7, 2);
    });

    it('should handle different user IDs for PIX payment', async () => {
      ordersService.confirmOrder.mockResolvedValue(mockConfirmedOrder);

      await service.confirmPaymentPix(mockPixPayment, 4);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledWith(1, 4);
    });

    it('should propagate OrdersService errors for PIX payment', async () => {
      const error = new Error('PIX processing failed');
      ordersService.confirmOrder.mockRejectedValue(error);

      await expect(
        service.confirmPaymentPix(mockPixPayment, 1),
      ).rejects.toThrow('PIX processing failed');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledWith(1, 1);
    });

    it('should handle multiple PIX payments for different orders', async () => {
      const pixPayment1 = { orderId: 15 };
      const pixPayment2 = { orderId: 20 };

      ordersService.confirmOrder
        .mockResolvedValueOnce({ ...mockConfirmedOrder, id: 15 })
        .mockResolvedValueOnce({ ...mockConfirmedOrder, id: 20 });

      const result1 = await service.confirmPaymentPix(pixPayment1, 1);
      const result2 = await service.confirmPaymentPix(pixPayment2, 1);

      expect(result1.id).toBe(15);
      expect(result2.id).toBe(20);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledTimes(2);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenNthCalledWith(1, 15, 1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenNthCalledWith(2, 20, 1);
    });
  });

  describe('Integration between payment methods', () => {
    it('should handle both credit card and PIX payments independently', async () => {
      ordersService.confirmOrder
        .mockResolvedValueOnce({ ...mockConfirmedOrder, id: 1 })
        .mockResolvedValueOnce({ ...mockConfirmedOrder, id: 2 });

      const creditCardResult = await service.confirmPaymentCreditCard(
        mockCreditCardPayment,
        1,
      );
      const pixResult = await service.confirmPaymentPix({ orderId: 2 }, 1);

      expect(creditCardResult.id).toBe(1);
      expect(pixResult.id).toBe(2);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenCalledTimes(2);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenNthCalledWith(1, 1, 1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ordersService.confirmOrder).toHaveBeenNthCalledWith(2, 2, 1);
    });
  });
});
