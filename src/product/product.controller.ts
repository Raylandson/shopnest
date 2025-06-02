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
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new product (requires authentication and ADMIN role)',
  })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation errors.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 409,
    description:
      'Conflict. Product name already exists or duplicate specification names provided.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productService.create(createProductDto);
    if (!product) {
      throw new Error('Product creation failed');
    }
    return product;
  }

  @Get()
  @ApiOperation({ summary: 'Get all products or search products' })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by product name',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by product category',
  })
  @ApiQuery({
    name: 'description',
    required: false,
    description: 'Search by keyword in description',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price',
  })
  @ApiResponse({
    status: 200,
    description: 'List of products.',
  })
  findAll(@Query() searchProductDto: SearchProductDto) {
    if (Object.keys(searchProductDto).length) {
      return this.productService.search(searchProductDto);
    }
    return this.productService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'The found product.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a product (requires authentication and ADMIN role)',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 409,
    description:
      'Conflict. Product name already exists or another unique constraint was violated (e.g., for product specifications).',
  })
  @ApiConsumes('application/json') // Specify content type
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a product (requires authentication and ADMIN role)',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
