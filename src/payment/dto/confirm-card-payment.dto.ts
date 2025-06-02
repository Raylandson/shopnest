import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ConfirmPaymentBaseDto } from './confirm-payment-base.dto';

export class ConfirmPaymentCard extends ConfirmPaymentBaseDto {
  @ApiProperty({
    example: '1234567890123456',
    description: 'Credit card number',
    minLength: 16,
    maxLength: 16,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(16, {
    message: 'Card number must be at least 16 characters long',
  })
  @MaxLength(16, {
    message: 'Card number must be at least 16 characters long',
  })
  cardNumber!: string;

  @ApiProperty({
    example: 'JOHN DOE',
    description: 'Name of the cardholder',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50, {
    message: 'Card holder name must not exceed 50 characters',
  })
  cardHolderName!: string;

  @ApiProperty({
    example: '12/29',
    description: 'Card expiration date (MM/YY)',
    minLength: 5,
    maxLength: 7,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, {
    message: 'Expiration date must be at least 5 characters long',
  })
  @MaxLength(7, {
    message: 'Expiration date must not exceed 7 characters',
  })
  expirationDate!: string;

  @ApiProperty({
    example: '123',
    description: 'Card security code (CVV)',
    minLength: 3,
    maxLength: 4,
  })
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
