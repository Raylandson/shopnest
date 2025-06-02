import { Injectable } from '@nestjs/common';
import { ConfirmPaymentCard } from './dto/confirm-card-payment.dto';
import { ConfirmPixPaymentDto } from './dto/confirm-pix-payment.dto';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class PaymentService {
  constructor(private ordersService: OrdersService) {}

  async confirmPaymentCreditCard(
    confirmPaymentDto: ConfirmPaymentCard,
    userId: number,
  ) {
    return await this.ordersService.confirmOrder(
      confirmPaymentDto.orderId,
      userId,
    );
  }

  async confirmPaymentPix(
    confirmPaymentPix: ConfirmPixPaymentDto,
    userId: number,
  ) {
    return await this.ordersService.confirmOrder(
      confirmPaymentPix.orderId,
      userId,
    );
  }
}
