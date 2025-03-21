import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { Record } from '../schemas/record.schema';
import { CreateOrderDto, OrderResponseDto, PaginatedOrderResponseDto } from '../dtos/order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Record.name) private recordModel: Model<Record>,
  ) {}

  private toResponseDto(order: Order): OrderResponseDto {
    return {
      id: order._id.toString(),
      recordId: order.recordId.toString(),
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      orderDate: order.orderDate,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress
    };
  }

  async create(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const record = await this.recordModel.findById(createOrderDto.recordId);
    if (!record) {
      throw new NotFoundException(`Record with ID ${createOrderDto.recordId} not found`);
    }

    if (record.qty < createOrderDto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const totalPrice = record.price * createOrderDto.quantity;

    const order = await this.orderModel.create({
      ...createOrderDto,
      totalPrice,
      orderDate: new Date(),
    });

    await this.recordModel.findByIdAndUpdate(createOrderDto.recordId, {
      $inc: { qty: -createOrderDto.quantity },
    });

    return this.toResponseDto(order);
  }

  async findAll(query: any): Promise<PaginatedOrderResponseDto> {
    const {
      page: rawPage = 1,
      limit: rawLimit = 10,
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = query;

    // Ensure valid pagination parameters
    const page = Math.max(1, Number(rawPage));
    const limit = Math.max(1, Math.min(100, Number(rawLimit))); // Cap at 100 items per page

    const skip = (page - 1) * limit;
    const sortOptions: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [orders, total] = await Promise.all([
      this.orderModel
        .find()
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments()
    ]);

    return {
      data: orders.map(order => this.toResponseDto(order as Order)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findById(id: string): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.toResponseDto(order);
  }
} 