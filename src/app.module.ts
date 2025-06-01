import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { PrismaClient } from 'generated/prisma';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [ProductModule, PrismaClient, AuthModule, UsersModule, CartModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
