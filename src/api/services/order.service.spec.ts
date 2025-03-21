import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OrderService } from './order.service';
import { Order } from '../schemas/order.schema';
import { Record } from '../schemas/record.schema';
import { CreateOrderDto } from '../dtos/order.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

describe('OrderService', () => {
  let service: OrderService;
  let orderModel: Model<Order>;
  let recordModel: Model<Record>;

  // Mock saved order
  const mockSavedOrder = {
    _id: '6502a59a5d6d1234567890ab',
    recordId: '6502a59a5d6d1234567890aa',
    quantity: 2,
    totalPrice: 59.98,
    orderDate: new Date('2023-09-14T10:00:00.000Z'),
    customerName: 'Sam Ru',
    customerEmail: 'samru@gmail.com',
    shippingAddress: '123 Main St'
  };

  const mockOrderModel = {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn().mockResolvedValue(mockSavedOrder),
  };

  const mockRecordModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  // Mock data for returned queries
  const mockOrder = {
    _id: '6502a59a5d6d1234567890ab',
    recordId: '6502a59a5d6d1234567890aa',
    quantity: 2,
    totalPrice: 59.98,
    orderDate: new Date('2023-09-14T10:00:00.000Z'),
    customerName: 'Sam Ru',
    customerEmail: 'samru@gmail.com',
    shippingAddress: '123 Main St'
  };

  const mockRecord = {
    _id: '6502a59a5d6d1234567890aa',
    artist: 'Test Artist',
    album: 'Test Album',
    price: 29.99,
    qty: 5,
    format: 'VINYL',
    category: 'ROCK',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
        {
          provide: getModelToken(Record.name),
          useValue: mockRecordModel,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderModel = module.get<Model<Order>>(getModelToken(Order.name));
    recordModel = module.get<Model<Record>>(getModelToken(Record.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an order successfully', async () => {
      const createOrderDto: CreateOrderDto = {
        recordId: '6502a59a5d6d1234567890aa',
        quantity: 2,
        customerName: 'Sam Ru',
        customerEmail: 'samru@gmail.com',
        shippingAddress: '123 Main St'
      };
      const mockRecord = { _id: '6502a59a5d6d1234567890aa', price: 29.99, qty: 5 };

      mockRecordModel.findById.mockResolvedValue(mockRecord);
      mockOrderModel.create.mockResolvedValue(mockSavedOrder);

      const result = await service.create(createOrderDto);

      expect(result).toEqual({
        id: '6502a59a5d6d1234567890ab',
        recordId: '6502a59a5d6d1234567890aa',
        quantity: 2,
        totalPrice: 59.98,
        orderDate: expect.any(Date),
        customerName: 'Sam Ru',
        customerEmail: 'samru@gmail.com',
        shippingAddress: '123 Main St'
      });
      expect(recordModel.findById).toHaveBeenCalledWith('6502a59a5d6d1234567890aa');
      expect(mockOrderModel.create).toHaveBeenCalledWith({
        recordId: '6502a59a5d6d1234567890aa',
        quantity: 2,
        totalPrice: 59.98,
        orderDate: expect.any(Date),
        customerName: 'Sam Ru',
        customerEmail: 'samru@gmail.com',
        shippingAddress: '123 Main St'
      });
      expect(recordModel.findByIdAndUpdate).toHaveBeenCalledWith('6502a59a5d6d1234567890aa', {
        $inc: { qty: -2 },
      });
    });

    it('should throw NotFoundException when record is not found', async () => {
      const createOrderDto: CreateOrderDto = {
        recordId: '1',
        quantity: 1,
        customerName: 'Sam Ru',
        customerEmail: 'samru@gmail.com',
        shippingAddress: '123 Main St'
      };
      mockRecordModel.findById.mockResolvedValue(null);

      await expect(service.create(createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      const createOrderDto: CreateOrderDto = {
        recordId: '1',
        quantity: 5,
        customerName: 'Sam Ru',
        customerEmail: 'samru@gmail.com',
        shippingAddress: '123 Main St'
      };
      const mockRecord = { _id: '1', price: 10, qty: 3 };
      mockRecordModel.findById.mockResolvedValue(mockRecord);

      await expect(service.create(createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        {
          _id: '1',
          recordId: '1',
          quantity: 1,
          totalPrice: 10,
          orderDate: new Date(),
          customerName: 'Sam Ru',
          customerEmail: 'samru@gmail.com',
          shippingAddress: '123 Main St'
        },
      ];
      mockOrderModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockOrders),
            }),
          }),
        }),
      });
      mockOrderModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: [
          {
            id: '1',
            recordId: '1',
            quantity: 1,
            totalPrice: 10,
            orderDate: expect.any(Date),
            customerName: 'Sam Ru',
            customerEmail: 'samru@gmail.com',
            shippingAddress: '123 Main St'
          },
        ],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('findById', () => {
    it('should return an order by id', async () => {
      const mockOrder = {
        _id: '1',
        recordId: '1',
        quantity: 1,
        totalPrice: 10,
        orderDate: new Date(),
        customerName: 'Sam Ru',
        customerEmail: 'samru@gmail.com',
        shippingAddress: '123 Main St'
      };
      mockOrderModel.findById.mockResolvedValue(mockOrder);

      const result = await service.findById('1');

      expect(result).toEqual({
        id: '1',
        recordId: '1',
        quantity: 1,
        totalPrice: 10,
        orderDate: expect.any(Date),
        customerName: 'Sam Ru',
        customerEmail: 'samru@gmail.com',
        shippingAddress: '123 Main St'
      });
      expect(orderModel.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when order is not found', async () => {
      mockOrderModel.findById.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });
}); 