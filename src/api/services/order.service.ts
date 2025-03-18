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
    };
  }

  async create(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const record = await this.recordModel.findById(createOrderDto.recordId);
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    if (record.qty < createOrderDto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const totalPrice = record.price * createOrderDto.quantity;

    const order = new this.orderModel({
      ...createOrderDto,
      totalPrice,
      orderDate: new Date(),
    });

    // Update record quantity
    await this.recordModel.findByIdAndUpdate(
      createOrderDto.recordId,
      { $inc: { qty: -createOrderDto.quantity } }
    );

    const savedOrder = await order.save();
    return this.toResponseDto(savedOrder);
  }

  async findAll(query: any): Promise<PaginatedOrderResponseDto> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = query;

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
      page: Number(page),
      limit: Number(limit),
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