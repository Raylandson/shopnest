import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ConfirmPaymentBaseDto {
  @ApiProperty({ example: 1, description: 'ID of the order to be paid' })
  @IsNumber()
  @IsNotEmpty()
  orderId!: number;
}
