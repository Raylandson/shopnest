import { IsNotEmpty, IsNumber } from 'class-validator';

export class ConfirmPaymentBaseDto {
  @IsNumber()
  @IsNotEmpty()
  orderId!: number;
}
