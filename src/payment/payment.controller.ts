import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ConfirmPaymentCard } from './dto/confirm-card-payment.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthenticatedRequest } from 'src/common/interfaces/user-auth.interface';
import { ConfirmPixPaymentDto } from './dto/confirm-pix-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(AuthGuard)
  @Post('/credit-card')
  confirmPaymentCreditCard(
    @Body() confirmPaymentCard: ConfirmPaymentCard,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.paymentService.confirmPaymentCreditCard(
      confirmPaymentCard,
      req.user.sub,
    );
  }

  @UseGuards(AuthGuard)
  @Post('/pix')
  confirmPaymentPix(
    @Body() confirmPaymentPix: ConfirmPixPaymentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.paymentService.confirmPaymentPix(
      confirmPaymentPix,
      req.user.sub,
    );
  }
}
