import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { CreateOrderDto, OrderResponseDto, PaginatedOrderResponseDto } from '../dtos/order.dto';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new order',
    description: 'Creates a new order and updates the record stock quantity.'
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Order successfully created.',
    type: OrderResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid data or insufficient stock.'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Record not found.'
  })
  async create(@Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all orders',
    description: 'Retrieves orders with pagination and sorting.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Orders per page (default: 10)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by (default: orderDate)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: desc)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated orders.',
    type: PaginatedOrderResponseDto
  })
  async findAll(@Query() query: any): Promise<PaginatedOrderResponseDto> {
    return this.orderService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get an order by ID',
    description: 'Retrieves detailed information about a specific order.'
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the order.',
    type: OrderResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Order not found.'
  })
  async findOne(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.orderService.findById(id);
  }
} 