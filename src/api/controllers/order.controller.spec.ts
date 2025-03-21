import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from '../services/order.service';
import { CreateOrderDto, OrderResponseDto, PaginatedOrderResponseDto } from '../dtos/order.dto';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;

  // Mock order data
  const mockOrder: OrderResponseDto = {
    id: '1',
    recordId: '1',
    quantity: 1,
    totalPrice: 10,
    orderDate: new Date(),
    customerName: 'Sam Ru',
    customerEmail: 'samru@gmail.com',
    shippingAddress: '123 Main St'
  };

  const mockPaginatedResponse: PaginatedOrderResponseDto = {
    data: [mockOrder],
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  };

  const createOrderDto: CreateOrderDto = {
    recordId: '1',
    quantity: 1,
    customerName: 'Sam Ru',
    customerEmail: 'samru@gmail.com',
    shippingAddress: '123 Main St'
  };

  // Mock service
  const mockOrderService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an order', async () => {
      mockOrderService.create.mockResolvedValue(mockOrder);

      const result = await controller.create(createOrderDto);

      expect(service.create).toHaveBeenCalledWith(createOrderDto);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      mockOrderService.findAll.mockResolvedValue(mockPaginatedResponse);
      const queryParams = { page: '1', limit: '10' };

      const result = await controller.findAll(queryParams);

      expect(service.findAll).toHaveBeenCalledWith(queryParams);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      mockOrderService.findById.mockResolvedValue(mockOrder);
      const orderId = mockOrder.id;

      const result = await controller.findOne(orderId);

      expect(service.findById).toHaveBeenCalledWith(orderId);
      expect(result).toEqual(mockOrder);
    });
  });
}); 