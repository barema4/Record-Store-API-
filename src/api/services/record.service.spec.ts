import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RecordService } from './record.service';
import { Record } from '../schemas/record.schema';
import { CreateRecordDto, UpdateRecordDto } from '../dtos/record.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RecordService', () => {
  let service: RecordService;
  let recordModel: Model<Record>;

  // Mock saved record
  const mockSavedRecord = {
    _id: '6502a59a5d6d1234567890aa',
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

  // Create a proper constructor mock for Mongoose models
  const RecordModelMock = jest.fn().mockImplementation((dto) => {
    return {
      ...dto,
      save: jest.fn().mockResolvedValue(mockSavedRecord),
    };
  });

  // For the test with MBID, we need a different saved record
  const mockSavedRecordWithMbid = {
    ...mockSavedRecord,
    mbid: 'test-mbid',
  };

  // Set up an alternative implementation for the MBID test
  const setupMockWithMbid = () => {
    RecordModelMock.mockImplementationOnce((dto) => {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue(mockSavedRecordWithMbid),
      };
    });
  };

  const mockRecordModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  // Mock data for query results
  const mockRecord = {
    _id: '6502a59a5d6d1234567890aa',
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordService,
        {
          provide: getModelToken(Record.name),
          // Combine the constructor function with the other mock methods
          useValue: Object.assign(RecordModelMock, mockRecordModel),
        },
      ],
    }).compile();

    service = module.get<RecordService>(RecordService);
    recordModel = module.get<Model<Record>>(getModelToken(Record.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a record successfully', async () => {

      mockRecordModel.findOne.mockResolvedValue(null);

      const result = await service.create(createRecordDto);

      expect(mockRecordModel.findOne).toHaveBeenCalledWith({
        artist: createRecordDto.artist,
        album: createRecordDto.album,
        format: createRecordDto.format,
      });
      expect(RecordModelMock).toHaveBeenCalledWith({
        ...createRecordDto,
        tracklist: [],
        created: expect.any(Date),
        lastModified: expect.any(Date),
      });
      expect(result).toEqual({
        id: mockSavedRecord._id,
        artist: mockSavedRecord.artist,
        album: mockSavedRecord.album,
        price: mockSavedRecord.price,
        qty: mockSavedRecord.qty,
        format: mockSavedRecord.format,
        category: mockSavedRecord.category,
        created: mockSavedRecord.created,
        lastModified: mockSavedRecord.lastModified,
        mbid: undefined,
        tracklist: mockSavedRecord.tracklist,
      });
    });

    it('should throw BadRequestException if record already exists', async () => {
  
      mockRecordModel.findOne.mockResolvedValue(mockRecord);

      await expect(service.create(createRecordDto)).rejects.toThrow(BadRequestException);
      expect(mockRecordModel.findOne).toHaveBeenCalledWith({
        artist: createRecordDto.artist,
        album: createRecordDto.album,
        format: createRecordDto.format,
      });
    });

    it('should fetch tracklist from MusicBrainz if mbid is provided', async () => {

      const dtoWithMbid = { ...createRecordDto, mbid: 'test-mbid' };
      mockRecordModel.findOne.mockResolvedValue(null);
      
      setupMockWithMbid();

      // Mock the MusicBrainz API response
      const mockMusicBrainzResponse = {
        data: `
          <metadata>
            <release>
              <medium-list>
                <medium>
                  <track-list>
                    <track>
                      <recording>
                        <title>Track 1</title>
                      </recording>
                    </track>
                    <track>
                      <recording>
                        <title>Track 2</title>
                      </recording>
                    </track>
                  </track-list>
                </medium>
              </medium-list>
            </release>
          </metadata>
        `,
      };
      mockedAxios.get.mockResolvedValue(mockMusicBrainzResponse);

      const result = await service.create(dtoWithMbid);

      expect(mockedAxios.get).toHaveBeenCalled();
      expect(RecordModelMock).toHaveBeenCalledWith({
        ...dtoWithMbid,
        tracklist: ['Track 1', 'Track 2'],
        created: expect.any(Date),
        lastModified: expect.any(Date),
      });
      expect(result.mbid).toBe('test-mbid');
    });
  });

  describe('update', () => {
    it('should update a record successfully', async () => {
   
      mockRecordModel.findById.mockResolvedValue(mockRecord);
      const updatedRecord = {
        ...mockRecord,
        price: updateRecordDto.price,
        qty: updateRecordDto.qty,
      };
      mockRecordModel.findByIdAndUpdate.mockResolvedValue(updatedRecord);

      const result = await service.update(mockRecord._id, updateRecordDto);

      expect(mockRecordModel.findById).toHaveBeenCalledWith(mockRecord._id);
      expect(mockRecordModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockRecord._id,
        {
          ...updateRecordDto,
          tracklist: mockRecord.tracklist,
          lastModified: expect.any(Date),
        },
        { new: true },
      );
      expect(result).toEqual({
        id: updatedRecord._id,
        artist: updatedRecord.artist,
        album: updatedRecord.album,
        price: updatedRecord.price,
        qty: updatedRecord.qty,
        format: updatedRecord.format,
        category: updatedRecord.category,
        created: updatedRecord.created,
        lastModified: updatedRecord.lastModified,
        mbid: undefined,
        tracklist: updatedRecord.tracklist,
      });
    });

    it('should throw BadRequestException if updating would create a duplicate record', async () => {
      mockRecordModel.findById.mockResolvedValue(mockRecord);
      
      // Simulate an existing record with the same artist, album, format
      const updateDtoWithDuplicate: UpdateRecordDto = {
        artist: 'Duplicate Artist',
      };
      
      mockRecordModel.findOne.mockResolvedValue({
        _id: 'different-id',
        artist: 'Duplicate Artist',
        album: mockRecord.album,
        format: mockRecord.format,
      });

      await expect(service.update(mockRecord._id, updateDtoWithDuplicate))
        .rejects.toThrow(BadRequestException);
      
      expect(mockRecordModel.findOne).toHaveBeenCalledWith({
        _id: { $ne: mockRecord._id },
        artist: 'Duplicate Artist',
        album: mockRecord.album,
        format: mockRecord.format,
      });
    });

    it('should throw NotFoundException if record not found', async () => {
      mockRecordModel.findById.mockResolvedValue(null);

      await expect(service.update('nonexistentid', updateRecordDto)).rejects.toThrow(NotFoundException);
      expect(mockRecordModel.findById).toHaveBeenCalledWith('nonexistentid');
    });

    it('should fetch new tracklist if mbid is updated', async () => {
      const recordWithMbid = { ...mockRecord, mbid: 'old-mbid' };
      mockRecordModel.findById.mockResolvedValue(recordWithMbid);
      
      const updateWithNewMbid = { ...updateRecordDto, mbid: 'new-mbid' };
      const updatedRecord = {
        ...recordWithMbid,
        ...updateWithNewMbid,
        tracklist: ['New Track 1', 'New Track 2'],
      };
      mockRecordModel.findByIdAndUpdate.mockResolvedValue(updatedRecord);

      // Mock the MusicBrainz API response
      const mockMusicBrainzResponse = {
        data: `
          <metadata>
            <release>
              <medium-list>
                <medium>
                  <track-list>
                    <track>
                      <recording>
                        <title>New Track 1</title>
                      </recording>
                    </track>
                    <track>
                      <recording>
                        <title>New Track 2</title>
                      </recording>
                    </track>
                  </track-list>
                </medium>
              </medium-list>
            </release>
          </metadata>
        `,
      };
      mockedAxios.get.mockResolvedValue(mockMusicBrainzResponse);

      const result = await service.update(mockRecord._id, updateWithNewMbid);

      expect(mockedAxios.get).toHaveBeenCalled();
      expect(result.mbid).toBe('new-mbid');
    });
  });

  describe('findAll', () => {
    it('should return paginated records with filters', async () => {

      const mockRecords = [mockRecord];
      const mockQuery = { 
        artist: 'Test', 
        minPrice: 20, 
        maxPrice: 30,
        inStock: true,
        page: 1, 
        limit: 10 
      };
      
      mockRecordModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockRecords)
            }),
          }),
        }),
      });
      
      mockRecordModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(mockQuery);

      expect(mockRecordModel.find).toHaveBeenCalledWith({
        artist: expect.any(RegExp),
        price: { $gte: 20, $lte: 30 },
        qty: { $gt: 0 },
      });
      expect(result).toEqual({
        data: [{
          id: mockRecord._id,
          artist: mockRecord.artist,
          album: mockRecord.album,
          price: mockRecord.price,
          qty: mockRecord.qty,
          format: mockRecord.format,
          category: mockRecord.category,
          created: mockRecord.created,
          lastModified: mockRecord.lastModified,
          mbid: undefined,
          tracklist: mockRecord.tracklist,
        }],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('findById', () => {
    it('should return a record by id', async () => {
      mockRecordModel.findById.mockResolvedValue(mockRecord);

      const result = await service.findById(mockRecord._id);

      expect(mockRecordModel.findById).toHaveBeenCalledWith(mockRecord._id);
      expect(result).toEqual({
        id: mockRecord._id,
        artist: mockRecord.artist,
        album: mockRecord.album,
        price: mockRecord.price,
        qty: mockRecord.qty,
        format: mockRecord.format,
        category: mockRecord.category,
        created: mockRecord.created,
        lastModified: mockRecord.lastModified,
        mbid: undefined,
        tracklist: mockRecord.tracklist,
      });
    });

    it('should throw NotFoundException if record not found', async () => {
      mockRecordModel.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistentid')).rejects.toThrow(NotFoundException);
      expect(mockRecordModel.findById).toHaveBeenCalledWith('nonexistentid');
    });
  });

  describe('delete', () => {
    it('should delete a record successfully', async () => {
      mockRecordModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await service.delete(mockRecord._id);

      expect(mockRecordModel.deleteOne).toHaveBeenCalledWith({ _id: mockRecord._id });
    });

    it('should throw NotFoundException if record not found', async () => {
      mockRecordModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(service.delete('nonexistentid')).rejects.toThrow(NotFoundException);
      expect(mockRecordModel.deleteOne).toHaveBeenCalledWith({ _id: 'nonexistentid' });
    });
  });
}); 