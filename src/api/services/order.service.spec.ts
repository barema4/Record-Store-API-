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
  };

  // Create a proper constructor mock for Mongoose models
  const OrderModelMock = jest.fn().mockImplementation((dto) => {
    return {
      ...dto,
      save: jest.fn().mockResolvedValue(mockSavedOrder),
    };
  });

  const mockOrderModel = {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
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
          // Combine the constructor function with the other mock methods
          useValue: Object.assign(OrderModelMock, mockOrderModel),
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
    const createOrderDto: CreateOrderDto = {
      recordId: '6502a59a5d6d1234567890aa',
      quantity: 2,
    };

    it('should create an order successfully', async () => {
   
      mockRecordModel.findById.mockResolvedValue(mockRecord);
      mockRecordModel.findByIdAndUpdate.mockResolvedValue(mockRecord);

      const result = await service.create(createOrderDto);

      expect(mockRecordModel.findById).toHaveBeenCalledWith(createOrderDto.recordId);
      expect(mockRecordModel.findByIdAndUpdate).toHaveBeenCalledWith(
        createOrderDto.recordId,
        { $inc: { qty: -createOrderDto.quantity } }
      );
      expect(OrderModelMock).toHaveBeenCalledWith({
        ...createOrderDto,
        totalPrice: mockRecord.price * createOrderDto.quantity,
        orderDate: expect.any(Date),
      });
      expect(result).toEqual({
        id: mockOrder._id,
        recordId: mockOrder.recordId,
        quantity: mockOrder.quantity,
        totalPrice: mockOrder.totalPrice,
        orderDate: mockOrder.orderDate,
      });
    });

    it('should throw NotFoundException if record not found', async () => {
      mockRecordModel.findById.mockResolvedValue(null);

      await expect(service.create(createOrderDto)).rejects.toThrow(NotFoundException);
      expect(mockRecordModel.findById).toHaveBeenCalledWith(createOrderDto.recordId);
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const lowStockRecord = { ...mockRecord, qty: 1 };
      mockRecordModel.findById.mockResolvedValue(lowStockRecord);
      
      await expect(service.create(createOrderDto)).rejects.toThrow(BadRequestException);
      expect(mockRecordModel.findById).toHaveBeenCalledWith(createOrderDto.recordId);
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [mockOrder];
      const mockQuery = { page: 1, limit: 10 };
      
      mockOrderModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockOrders)
            }),
          }),
        }),
      });
      
      mockOrderModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual({
        data: [{
          id: mockOrder._id,
          recordId: mockOrder.recordId,
          quantity: mockOrder.quantity,
          totalPrice: mockOrder.totalPrice,
          orderDate: mockOrder.orderDate,
        }],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('findById', () => {
    it('should return an order by id', async () => {
      mockOrderModel.findById.mockResolvedValue(mockOrder);

      const result = await service.findById(mockOrder._id);

      expect(mockOrderModel.findById).toHaveBeenCalledWith(mockOrder._id);
      expect(result).toEqual({
        id: mockOrder._id,
        recordId: mockOrder.recordId,
        quantity: mockOrder.quantity,
        totalPrice: mockOrder.totalPrice,
        orderDate: mockOrder.orderDate,
      });
    });

    it('should throw NotFoundException if order not found', async () => {
      mockOrderModel.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistentid')).rejects.toThrow(NotFoundException);
      expect(mockOrderModel.findById).toHaveBeenCalledWith('nonexistentid');
    });
  });
}); 