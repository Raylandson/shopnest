import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthenticatedRequest } from '../common/interfaces/user-auth.interface';
import { AuthGuard } from '../auth/auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Create a new order from the user's cart (requires authentication)",
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Cart not found or empty.' })
  async create(@Request() req: AuthenticatedRequest) {
    const user = req.user;
    return this.ordersService.create(user.sub);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get all orders for the authenticated user (requires authentication)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved orders.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.ordersService.findAll(req.user.sub);
  }
}
