import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
  Request,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { CartItemDto } from './dto/cart-item.dto';
import { CartService } from './cart.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthenticatedRequest } from 'src/common/interfaces/user-auth.interface';
import { Response } from 'express';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}
  @UseGuards(AuthGuard)
  @Get()
  getItems(@Request() req: AuthenticatedRequest) {
    return this.cartService.getAllCartItemsByUserId(req.user.sub);
  }
  @UseGuards(AuthGuard)
  @Put()
  async updateItemQuantity(
    @Body() cartItemDto: CartItemDto,
    @Request() req: AuthenticatedRequest,
    @Res() response: Response,
  ) {
    const cartItem = await this.cartService.updateItemQuantity(
      cartItemDto,
      req.user.sub,
    );

    if (cartItem === null) {
      response.status(HttpStatus.NO_CONTENT).send();
    } else {
      response.status(HttpStatus.OK).json(cartItem);
    }
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async removeItem(
    @Param('id') id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.cartService.removeItem(id, req.user.sub);
  }
}
