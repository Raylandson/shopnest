import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Order, OrderItem } from '../../generated/prisma';

@Injectable()
export class OrdersRepository {
  constructor(private prisma: PrismaService) {}

  async createOrderAndItems(
    userId: number,
    totalAmount: number,
    items: { productId: number; quantity: number }[],
  ): Promise<Order & { orderItems: OrderItem[] }> {
    return this.prisma.order.create({
      data: {
        userId: userId,
        totalAmount: totalAmount,
        orderItems: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });
  }

  async createOrder(
    loggedUserId: number,
    totalAmount: number,
    cartItemsToOrder: { productId: number; quantity: number }[],
  ): Promise<Order & { orderItems: OrderItem[] }> {
    const newOrder = await this.prisma.order.create({
      data: {
        userId: loggedUserId,
        totalAmount: totalAmount,
        orderItems: {
          create: cartItemsToOrder.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    return newOrder;
  }

  async updateOrder(
    orderId: number,
    loggedUserId: number,
  ): Promise<Order & { orderItems: OrderItem[] }> {
    return await this.prisma.order.update({
      where: {
        id: orderId,
        userId: loggedUserId,
      },
      data: {
        isConfirmed: true,
      },
      include: {
        orderItems: true,
      },
    });
  }

  async findOrderById(
    orderId: number,
    loggedUserId: number,
  ): Promise<(Order & { orderItems: OrderItem[] }) | null> {
    return await this.prisma.order.findUnique({
      where: {
        id: orderId,
        userId: loggedUserId,
      },
      include: {
        orderItems: true,
      },
    });
  }

  async findAll(userId: number): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: {
        userId: userId,
      },
      include: {
        orderItems: true,
      },
    });
  }
}
