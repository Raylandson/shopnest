import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productService.create(createProductDto);
    if (!product) {
      throw new Error('Product creation failed');
    }
    return product;
  }

  @Get('/all')
  async findAll() {
    return this.productService.findAll();
  }

  @Get('search')
  async search(@Query() searchDto: SearchProductDto) {
    return this.productService.search(searchDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id); // Remove +id since ParseIntPipe already converts
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto); // Remove +id
  }
  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id); // Remove +id since ParseIntPipe already converts
  }
}
