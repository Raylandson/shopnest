import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthenticatedRequest } from 'src/common/interfaces/user-auth.interface';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(@Request() req: AuthenticatedRequest) {
    const user = req.user;
    console.log('User ID:', user.sub);
    return this.ordersService.create(user.sub);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.ordersService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}
