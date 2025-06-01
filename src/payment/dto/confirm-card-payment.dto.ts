import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ConfirmPaymentBaseDto } from './confirm-payment-base.dto';

export class ConfirmPaymentCard extends ConfirmPaymentBaseDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(16, {
    message: 'Card number must be at least 16 characters long',
  })
  @MaxLength(16, {
    message: 'Card number must be at least 16 characters long',
  })
  cardNumber!: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(50, {
    message: 'Card holder name must not exceed 50 characters',
  })
  cardHolderName!: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(5, {
    message: 'Expiration date must be at least 5 characters long',
  })
  @MaxLength(7, {
    message: 'Expiration date must not exceed 7 characters',
  })
  expirationDate!: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(3, {
    message: 'CVV must be at least 3 characters long',
  })
  @MaxLength(4, {
    message: 'CVV must not exceed 4 characters',
  })
  cvv!: string;
}
