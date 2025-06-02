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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CartItemDto } from './dto/cart-item.dto';
// import { CartItem } from './entities/cart-item.entity';
import { CartService } from './cart.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthenticatedRequest } from 'src/common/interfaces/user-auth.interface';
import { Response } from 'express';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}
  @UseGuards(AuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all items in the user's cart" })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved cart items.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getItems(@Request() req: AuthenticatedRequest) {
    return this.cartService.getAllCartItemsByUserId(req.user.sub);
  }
  @UseGuards(AuthGuard)
  @Put()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update item quantity in cart or add item if not present',
  })
  @ApiBody({ type: CartItemDto })
  @ApiResponse({
    status: 200,
    description: 'Item quantity updated successfully.',
  })
  @ApiResponse({
    status: 204,
    description: 'Item removed from cart (quantity became 0).',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an item from the cart' })
  @ApiParam({
    name: 'id',
    description: 'ID of the cart item to remove',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Item removed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Cart item not found.' })
  async removeItem(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.cartService.removeItem(parseInt(id, 10), req.user.sub);
  }
}
