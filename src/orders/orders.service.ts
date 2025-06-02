import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { Order, OrderItem } from '../../generated/prisma';
import { CartService } from '../cart/cart.service';

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
    const order = await this.ordersRepository.findOrderById(
      orderId,
      loggedUserId,
    );
    if (!order) {
      throw new NotFoundException(
        `Order with ID #${orderId} not found for user ID: ${loggedUserId}.`,
      );
    }
    if (order.isConfirmed) {
      throw new ConflictException(
        `Order with ID #${orderId} is already confirmed.`,
      );
    }
    return await this.ordersRepository.updateOrder(orderId, loggedUserId);
  }

  async findAll(userId: number) {
    return await this.ordersRepository.findAll(userId);
  }
}
