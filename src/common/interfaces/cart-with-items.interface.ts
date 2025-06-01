import { Cart, CartItem, Product } from 'generated/prisma';

export type CartWithProducts = Cart & {
  cartItems: (CartItem & { product: Product | null })[];
};
