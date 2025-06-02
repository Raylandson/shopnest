import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/user-auth.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfirmPaymentCard } from './dto/confirm-card-payment.dto';
import { ConfirmPixPaymentDto } from './dto/confirm-pix-payment.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/credit-card')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm payment using credit card (requires authentication)',
  })
  @ApiBody({ type: ConfirmPaymentCard })
  @ApiResponse({
    status: 201,
    description: 'Payment confirmed successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 402,
    description: 'Payment Required (e.g., card declined).',
  })
  confirmPaymentCreditCard(
    @Body() confirmPaymentCard: ConfirmPaymentCard,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.paymentService.confirmPaymentCreditCard(
      confirmPaymentCard,
      req.user.sub,
    );
  }

  @Post('/pix')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm payment using PIX (requires authentication)',
  })
  @ApiBody({ type: ConfirmPixPaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment confirmed successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 402,
    description: 'Payment Required (e.g., PIX processing issue).',
  })
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
