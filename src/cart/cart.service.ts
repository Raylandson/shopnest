import { Injectable, NotFoundException } from '@nestjs/common';
import { CartItemDto } from './dto/cart-item.dto';
import { CartRepository } from './cart.repository';
import { Cart, CartItem } from '../../generated/prisma';
import { CartWithProducts } from 'src/common/interfaces/cart-with-items.interface';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';

@Injectable()
export class CartService {
  constructor(private cartRepository: CartRepository) {}

  async updateItemQuantity(
    cartItemDto: CartItemDto,
    userId: number,
  ): Promise<CartItem | null> {
    const cart = await this.handleCart(userId);

    const existingItem = await this.cartRepository.findCartItem(
      cartItemDto.productId,
      cart.id,
    );

    if (existingItem) {
      if (existingItem.quantity + cartItemDto.quantity <= 0) {
        await this.cartRepository.deleteCartItem(existingItem.id);
        return null;
      }
      return await this.cartRepository.updateCartItemQuantity(
        existingItem.id,
        existingItem.quantity + cartItemDto.quantity,
      );
    }
    try {
      const createdItem = await this.cartRepository.createCartItem(
        cartItemDto,
        cart.id,
      );
      return createdItem;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        (error.code === 'P2025' ||
          error.code === 'P2003' ||
          error.code === 'P2026')
      ) {
        throw new NotFoundException(
          `Product with ID #${cartItemDto.productId} not found`,
        );
      }
      throw error;
    }
  }

  async removeItem(id: number, userId: number): Promise<CartItem> {
    const cartItem = await this.cartRepository.findCartItemById(id, userId);
    if (!cartItem) {
      throw new NotFoundException(
        `Cart item with ID #${id} not found in your cart`,
      );
    }
    const deletedItem = await this.cartRepository.deleteCartItem(id);
    if (!deletedItem) {
      throw new NotFoundException(`Cart item with ID #${id} not found`);
    }
    return deletedItem;
  }

  private async handleCart(
    userId: number,
  ): Promise<Cart & { cartItems: CartItem[] }> {
    let cart = await this.cartRepository.findCartByUserId(userId);

    if (!cart) {
      cart = await this.cartRepository.createCart(userId);
    }
    return cart;
  }

  async findCartWithItemsByUserId(
    userId: number,
  ): Promise<CartWithProducts | null> {
    return await this.cartRepository.findCartWithItemsByUserId(userId);
  }

  async getAllCartItemsByUserId(
    userId: number,
  ): Promise<CartWithProducts | null> {
    return await this.cartRepository.findCartWithItemsByUserId(userId);
  }

  async clearCart(cartIdToClear: number): Promise<void> {
    await this.cartRepository.clearCart(cartIdToClear);
  }
}
