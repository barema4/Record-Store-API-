import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Record } from '../schemas/record.schema';
import { CreateRecordDto, UpdateRecordDto } from '../dtos/record.dto';
import { RecordResponseDto, PaginatedRecordResponseDto } from '../dtos/record.response.dto';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class RecordService {
  constructor(
    @InjectModel(Record.name) private recordModel: Model<Record>,
  ) {}

  private toResponseDto(record: Record): RecordResponseDto {
    return {
      id: record._id.toString(),
      artist: record.artist,
      album: record.album,
      price: record.price,
      qty: record.qty,
      format: record.format,
      category: record.category,
      created: record.created,
      lastModified: record.lastModified,
      mbid: record.mbid,
      tracklist: record.tracklist || [],
    };
  }

  private async fetchMusicBrainzData(mbid: string): Promise<string[]> {
    try {
      // Add delay to respect MusicBrainz rate limiting (1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await axios.get(
        `http://musicbrainz.org/ws/2/release/${mbid}?inc=recordings`,
        {
          headers: {
            'User-Agent': 'BrokenRecordStore/1.0.0 (contact@brokenrecordstore.com)',
            'Accept': 'application/xml'
          }
        }
      );

      const result = await parseStringPromise(response.data);
      const tracks = result.metadata?.release?.[0]?.['medium-list']?.[0]?.medium?.[0]?.['track-list']?.[0]?.track || [];
      
      return tracks.map(track => track.recording[0].title[0]);
    } catch (error) {
      console.error('Error fetching MusicBrainz data:', error.message);
      return [];
    }
  }

  async create(createRecordDto: CreateRecordDto): Promise<RecordResponseDto> {
    // Check if record already exists
    const existingRecord = await this.recordModel.findOne({
      artist: createRecordDto.artist,
      album: createRecordDto.album,
      format: createRecordDto.format
    });

    if (existingRecord) {
      throw new BadRequestException('Record already exists');
    }

    // If MBID is provided, fetch tracklist from MusicBrainz
    let tracklist: string[] = [];
    if (createRecordDto.mbid) {
      tracklist = await this.fetchMusicBrainzData(createRecordDto.mbid);
    }

    const record = new this.recordModel({
      ...createRecordDto,
      tracklist,
      created: new Date(),
      lastModified: new Date()
    });

    const savedRecord = await record.save();
    return this.toResponseDto(savedRecord);
  }

  async update(id: string, updateRecordDto: UpdateRecordDto): Promise<RecordResponseDto> {
    const record = await this.recordModel.findById(id);
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    // If MBID is updated, fetch new tracklist
    let tracklist = record.tracklist;
    if (updateRecordDto.mbid && updateRecordDto.mbid !== record.mbid) {
      tracklist = await this.fetchMusicBrainzData(updateRecordDto.mbid);
    }

    const updatedRecord = await this.recordModel.findByIdAndUpdate(
      id,
      {
        ...updateRecordDto,
        tracklist,
        lastModified: new Date()
      },
      { new: true }
    );

    return this.toResponseDto(updatedRecord);
  }

  async findAll(query: any): Promise<PaginatedRecordResponseDto> {
    const {
      artist,
      album,
      format,
      category,
      minPrice,
      maxPrice,
      inStock,
      page = 1,
      limit = 10,
      sortBy = 'lastModified',
      sortOrder = 'desc'
    } = query;

    const filter: any = {};
    
    if (artist) filter.artist = new RegExp(artist, 'i');
    if (album) filter.album = new RegExp(album, 'i');
    if (format) filter.format = format;
    if (category) filter.category = category;
    if (inStock) filter.qty = { $gt: 0 };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = minPrice;
      if (maxPrice) filter.price.$lte = maxPrice;
    }

    const skip = (page - 1) * limit;
    const sortOptions: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [records, total] = await Promise.all([
      this.recordModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.recordModel.countDocuments(filter)
    ]);

    return {
      data: records.map(record => this.toResponseDto(record as Record)),
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findById(id: string): Promise<RecordResponseDto> {
    const record = await this.recordModel.findById(id);
    if (!record) {
      throw new NotFoundException('Record not found');
    }
    return this.toResponseDto(record);
  }

  async delete(id: string): Promise<void> {
    const result = await this.recordModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Record not found');
    }
  }
}

