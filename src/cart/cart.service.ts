import { Injectable } from '@nestjs/common';
import { CartItemDto } from './dto/cart-item.dto';
import { CartRepository } from './cart.repository';
import { Cart, CartItem } from '../../generated/prisma';

@Injectable()
export class CartService {
  constructor(private cartRepository: CartRepository) {}

  async addItem(cartItemDto: CartItemDto, userId: number): Promise<CartItem> {
    const cart = await this.handleCart(userId);

    const existingItem = await this.cartRepository.findCartItem(
      cartItemDto.productId,
      cart.id,
    );

    if (existingItem) {
      return await this.cartRepository.updateCartItemQuantity(
        existingItem.id,
        existingItem.quantity + cartItemDto.quantity,
      );
    }
    return await this.cartRepository.createCartItem(cartItemDto, cart.id);
  }

  async removeItem(id: number, userId: number): Promise<CartItem> {
    return await this.cartRepository.deleteCartItem(id, userId);
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
}
