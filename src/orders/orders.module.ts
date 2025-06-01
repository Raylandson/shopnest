import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrdersRepository } from './orders.repository';
import { CartModule } from 'src/cart/cart.module';
// import { CartService } from 'src/cart/cart.service';

@Module({
  imports: [PrismaModule, CartModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService], // Add this line
})
export class OrdersModule {}
