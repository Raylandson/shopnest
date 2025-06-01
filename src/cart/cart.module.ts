import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CartRepository } from './cart.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [CartService, CartRepository],
})
export class CartModule {}
