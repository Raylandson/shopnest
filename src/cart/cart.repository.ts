import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cart, CartItem } from '../../generated/prisma';
import { CartItemDto } from './dto/cart-item.dto';
import { CartWithProducts } from 'src/common/interfaces/cart-with-items.interface';

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
  async findCartWithItemsByUserId(
    userId: number,
  ): Promise<CartWithProducts | null> {
    return await this.prisma.cart.findUnique({
      where: {
        userId: userId,
      },
      include: {
        cartItems: {
          include: {
            product: true,
          },
        },
      },
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
      include: { cartItems: true },
    });
  }

  async clearCart(cartIdToClear: number): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: {
        cartId: cartIdToClear,
      },
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
        cartId: cartId,
      },
    });
  }

  async deleteCartItem(itemId: number, userId: number): Promise<CartItem> {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId: userId,
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException(
        `Cart item with ID #${itemId} not found in your cart.`,
      );
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }
}
