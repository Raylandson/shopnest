import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cart, CartItem } from '../../generated/prisma';
import { CartItemDto } from './dto/cart-item.dto';

@Injectable()
export class CartRepository {
  constructor(private prisma: PrismaService) {}

  async findCartByUserId(
    userId: number,
  ): Promise<(Cart & { cartItems: CartItem[] }) | null> {
    return this.prisma.cart.findFirst({
      where: { userId },
      include: { cartItems: true },
    });
  }

  async createCart(userId: number): Promise<Cart & { cartItems: CartItem[] }> {
    return this.prisma.cart.create({
      data: {
        userId,
        cartItems: {
          create: [],
        },
      },
      include: { cartItems: true }, // Ensure cartItems are included in the returned object
    });
  }

  async findCartItem(
    productId: number,
    cartId: number,
  ): Promise<CartItem | null> {
    return this.prisma.cartItem.findFirst({
      where: {
        productId,
        cartId,
      },
    });
  }

  async updateCartItemQuantity(
    itemId: number,
    newQuantity: number,
  ): Promise<CartItem> {
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity,
      },
    });
  }

  async createCartItem(
    cartItemDto: CartItemDto,
    cartId: number,
  ): Promise<CartItem> {
    return this.prisma.cartItem.create({
      data: {
        productId: cartItemDto.productId,
        quantity: cartItemDto.quantity,
        cartId,
      },
    });
  }

  async deleteCartItem(itemId: number, userId: number): Promise<CartItem> {
    return this.prisma.cartItem.delete({
      where: { id: itemId, cart: { userId } },
    });
  }
}
