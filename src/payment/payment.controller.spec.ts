import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../auth/auth.guard';
import { ConfirmPaymentCard } from './dto/confirm-card-payment.dto';
import { ConfirmPixPaymentDto } from './dto/confirm-pix-payment.dto';
import { AuthenticatedRequest } from '../common/interfaces/user-auth.interface';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;

  const mockAuthenticatedRequest = {
    user: {
      sub: 1,
      username: 'testuser',
      iat: Date.now(),
      exp: Date.now() + 3600,
    },
  } as AuthenticatedRequest;

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
    const mockPaymentService = {
      confirmPaymentCreditCard: jest.fn(),
      confirmPaymentPix: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PaymentController>(PaymentController);
    paymentService = module.get<PaymentService>(
      PaymentService,
    ) as jest.Mocked<PaymentService>;

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('confirmPaymentCreditCard', () => {
    it('should confirm payment with credit card successfully', async () => {
      paymentService.confirmPaymentCreditCard.mockResolvedValue(
        mockConfirmedOrder,
      );

      const result = await controller.confirmPaymentCreditCard(
        mockCreditCardPayment,
        mockAuthenticatedRequest,
      );

      expect(result).toEqual(mockConfirmedOrder);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(paymentService.confirmPaymentCreditCard).toHaveBeenCalledWith(
        mockCreditCardPayment,
        1,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(paymentService.confirmPaymentCreditCard).toHaveBeenCalledTimes(1);
    });

    it('should extract user ID from authenticated request', async () => {
      paymentService.confirmPaymentCreditCard.mockResolvedValue(
        mockConfirmedOrder,
      );

      await controller.confirmPaymentCreditCard(
        mockCreditCardPayment,
        mockAuthenticatedRequest,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(paymentService.confirmPaymentCreditCard).toHaveBeenCalledWith(
        mockCreditCardPayment,
        mockAuthenticatedRequest.user.sub,
      );
    });

    it('should handle credit card payment with different order ID', async () => {
      const differentOrderPayment = { ...mockCreditCardPayment, orderId: 5 };
      paymentService.confirmPaymentCreditCard.mockResolvedValue({
        ...mockConfirmedOrder,
        id: 5,
      });

      const result = await controller.confirmPaymentCreditCard(
        differentOrderPayment,
        mockAuthenticatedRequest,
      );

      expect(result.id).toBe(5);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(paymentService.confirmPaymentCreditCard).toHaveBeenCalledWith(
        differentOrderPayment,
        1,
      );
    });

    it('should propagate service errors for credit card payment', async () => {
      const error = new Error('Payment processing failed');
      paymentService.confirmPaymentCreditCard.mockRejectedValue(error);

      await expect(
        controller.confirmPaymentCreditCard(
          mockCreditCardPayment,
          mockAuthenticatedRequest,
        ),
      ).rejects.toThrow('Payment processing failed');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(paymentService.confirmPaymentCreditCard).toHaveBeenCalledWith(
        mockCreditCardPayment,
        1,
      );
    });
  });

  describe('confirmPaymentPix', () => {
    it('should confirm payment with PIX successfully', async () => {
      paymentService.confirmPaymentPix.mockResolvedValue(mockConfirmedOrder);

      const result = await controller.confirmPaymentPix(
        mockPixPayment,
        mockAuthenticatedRequest,
      );

      expect(result).toEqual(mockConfirmedOrder);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(paymentService.confirmPaymentPix).toHaveBeenCalledWith(
        mockPixPayment,
        1,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(paymentService.confirmPaymentPix).toHaveBeenCalledTimes(1);
    });

    it('should extract user ID from authenticated request for PIX', async () => {
      paymentService.confirmPaymentPix.mockResolvedValue(mockConfirmedOrder);

      await controller.confirmPaymentPix(
        mockPixPayment,
        mockAuthenticatedRequest,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(paymentService.confirmPaymentPix).toHaveBeenCalledWith(
        mockPixPayment,
        mockAuthenticatedRequest.user.sub,
      );
    });

    it('should handle PIX payment with different order ID', async () => {
      const differentOrderPayment = { ...mockPixPayment, orderId: 3 };
      paymentService.confirmPaymentPix.mockResolvedValue({
        ...mockConfirmedOrder,
        id: 3,
      });

      const result = await controller.confirmPaymentPix(
        differentOrderPayment,
        mockAuthenticatedRequest,
      );

      expect(result.id).toBe(3);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(paymentService.confirmPaymentPix).toHaveBeenCalledWith(
        differentOrderPayment,
        1,
      );
    });

    it('should propagate service errors for PIX payment', async () => {
      const error = new Error('PIX payment failed');
      paymentService.confirmPaymentPix.mockRejectedValue(error);

      await expect(
        controller.confirmPaymentPix(mockPixPayment, mockAuthenticatedRequest),
      ).rejects.toThrow('PIX payment failed');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(paymentService.confirmPaymentPix).toHaveBeenCalledWith(
        mockPixPayment,
        1,
      );
    });
  });
});
