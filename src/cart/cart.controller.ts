import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartItemDto } from './dto/cart-item.dto';
import { CartService } from './cart.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthenticatedRequest } from 'src/common/interfaces/user-auth.interface';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}
  //do this with a guard
  @UseGuards(AuthGuard)
  @Get()
  getItems() {
    return 'List of items in the cart';
  }
  @UseGuards(AuthGuard)
  @Put()
  async addItem(
    @Body() cartItemDto: CartItemDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const user = req.user;
    console.log('User ID:', user, cartItemDto);
    return this.cartService.addItem(cartItemDto, user.sub);
  }
  @UseGuards(AuthGuard)
  @Delete(':id')
  async removeItem(
    @Param('id') id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    const user = req.user;
    return this.cartService.removeItem(id, user.sub);
  }
}
