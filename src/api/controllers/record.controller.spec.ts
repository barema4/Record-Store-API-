import { Test, TestingModule } from '@nestjs/testing';
import { RecordController } from './record.controller';
import { RecordService } from '../services/record.service';
import { CreateRecordDto, UpdateRecordDto } from '../dtos/record.dto';
import { RecordResponseDto, PaginatedRecordResponseDto } from '../dtos/record.response.dto';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';

describe('RecordController', () => {
  let controller: RecordController;
  let service: RecordService;

  // Mock record data
  const mockRecord: RecordResponseDto = {
    id: '6502a59a5d6d1234567890aa',
    artist: 'Test Artist',
    album: 'Test Album',
    price: 29.99,
    qty: 5,
    format: RecordFormat.VINYL,
    category: RecordCategory.ROCK,
    created: new Date('2023-09-14T10:00:00.000Z'),
    lastModified: new Date('2023-09-14T10:00:00.000Z'),
    tracklist: ['Track 1', 'Track 2'],
  };

  const mockPaginatedResponse: PaginatedRecordResponseDto = {
    data: [mockRecord],
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  };

  const createRecordDto: CreateRecordDto = {
    artist: 'Test Artist',
    album: 'Test Album',
    price: 29.99,
    qty: 5,
    format: RecordFormat.VINYL,
    category: RecordCategory.ROCK,
  };

  const updateRecordDto: UpdateRecordDto = {
    price: 39.99,
    qty: 10,
  };

  // Mock service
  const mockRecordService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordController],
      providers: [
        {
          provide: RecordService,
          useValue: mockRecordService,
        },
      ],
    }).compile();

    controller = module.get<RecordController>(RecordController);
    service = module.get<RecordService>(RecordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a record', async () => {
      mockRecordService.create.mockResolvedValue(mockRecord);

      const result = await controller.create(createRecordDto);

      expect(service.create).toHaveBeenCalledWith(createRecordDto);
      expect(result).toEqual(mockRecord);
    });
  });

  describe('findAll', () => {
    it('should return paginated records', async () => {

      mockRecordService.findAll.mockResolvedValue(mockPaginatedResponse);
      const queryParams = { 
        artist: 'Test', 
        minPrice: '20', 
        maxPrice: '30',
        page: '1', 
        limit: '10' 
      };

      const result = await controller.findAll(queryParams);

      expect(service.findAll).toHaveBeenCalledWith(queryParams);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return a record by id', async () => {
      mockRecordService.findById.mockResolvedValue(mockRecord);
      const recordId = mockRecord.id;

      const result = await controller.findOne(recordId);

      expect(service.findById).toHaveBeenCalledWith(recordId);
      expect(result).toEqual(mockRecord);
    });
  });

  describe('update', () => {
    it('should update a record', async () => {

      const updatedRecord = { ...mockRecord, ...updateRecordDto };
      mockRecordService.update.mockResolvedValue(updatedRecord);
      const recordId = mockRecord.id;

      const result = await controller.update(recordId, updateRecordDto);

      expect(service.update).toHaveBeenCalledWith(recordId, updateRecordDto);
      expect(result).toEqual(updatedRecord);
    });
  });

  describe('remove', () => {
    it('should delete a record', async () => {
      mockRecordService.delete.mockResolvedValue(undefined);
      const recordId = mockRecord.id;

      await controller.remove(recordId);

      expect(service.delete).toHaveBeenCalledWith(recordId);
    });
  });
});
