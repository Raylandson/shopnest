import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { Order, OrderItem } from '../../generated/prisma';
import { CartService } from 'src/cart/cart.service';

@Injectable()
export class OrdersService {
  constructor(
    private ordersRepository: OrdersRepository,
    private cartService: CartService,
  ) {}
  async create(
    loggedUserId: number,
  ): Promise<Order & { orderItems: OrderItem[] }> {
    const cartWithItems =
      await this.cartService.findCartWithItemsByUserId(loggedUserId);

    if (!cartWithItems) {
      throw new NotFoundException(
        `Cart not found for user ID: ${loggedUserId}.`,
      );
    }

    if (!cartWithItems.cartItems || cartWithItems.cartItems.length === 0) {
      throw new NotFoundException('Cannot create order from an empty cart.');
    }

    const totalAmount = cartWithItems.cartItems.reduce((sum, item) => {
      if (item.product && item.product.price && item.quantity > 0) {
        return sum + item.product.price * item.quantity;
      }
      return sum;
    }, 0);

    if (totalAmount <= 0) {
      throw new NotFoundException(
        'Cannot create order with zero or negative total amount. Check product prices and quantities.',
      );
    }

    const itemsToOrder = cartWithItems.cartItems.map((cartItem) => ({
      productId: cartItem.productId,
      quantity: cartItem.quantity,
    }));

    const order = this.ordersRepository.createOrder(
      loggedUserId,
      totalAmount,
      itemsToOrder,
    );
    await this.cartService.clearCart(cartWithItems.id);

    return order;
  }

  async confirmOrder(
    orderId: number,
    loggedUserId: number,
  ): Promise<Order & { orderItems: OrderItem[] }> {
    return this.ordersRepository.confirmOrder(orderId, loggedUserId);
  }

  async findAll(userId: number) {
    return await this.ordersRepository.findAll(userId);
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
