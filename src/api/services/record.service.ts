import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Record } from '../schemas/record.schema';
import { CreateRecordDto, UpdateRecordDto } from '../dtos/record.dto';
import { RecordResponseDto, PaginatedRecordResponseDto } from '../dtos/record.response.dto';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

interface MusicBrainzData {
  tracklist: string[];
  artist?: string;
  album?: string;
  releaseDate?: string;
}

// Extended types to include tracklist
interface EnhancedCreateRecordDto extends CreateRecordDto {
  tracklist?: string[];
}

interface EnhancedUpdateRecordDto extends UpdateRecordDto {
  tracklist?: string[];
}

@Injectable()
export class RecordService {
  private readonly logger = new Logger(RecordService.name);

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

  private async fetchMusicBrainzData(mbid: string): Promise<MusicBrainzData> {
    this.logger.log(`Fetching MusicBrainz data for MBID: ${mbid}`);
    
    try {
      // Add delay to respect MusicBrainz rate limiting (1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const url = `http://musicbrainz.org/ws/2/release/${mbid}?inc=recordings+artists+release-groups`;
      this.logger.log(`Making request to: ${url}`);
      
      const response = await axios.get(
        url,
        {
          headers: {
            'User-Agent': 'BrokenRecordStore/1.0.0 (contact@brokenrecordstore.com)',
            'Accept': 'application/xml'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (!response.data) {
        this.logger.error('Empty response from MusicBrainz API');
        return { tracklist: [] };
      }
      
      this.logger.log('Successfully received response from MusicBrainz');
      
      const result = await parseStringPromise(response.data);
      if (!result || !result.metadata) {
        this.logger.error('Failed to parse MusicBrainz XML or missing metadata', { result });
        return { tracklist: [] };
      }
      
      this.logger.debug('Parsed XML structure', { 
        hasRelease: !!result.metadata.release,
        releaseLength: result.metadata.release?.length
      });
      
      const data: MusicBrainzData = { tracklist: [] };
      
      try {
        const release = result.metadata?.release?.[0];
        if (!release) {
          this.logger.warn('No release found in response');
          return { tracklist: [] };
        }
        
        // Extract album title
        if (release.title && release.title[0]) {
          data.album = release.title[0];
          this.logger.log(`Found album title: ${data.album}`);
        }
        
        // Extract artist name
        if (release['artist-credit'] && release['artist-credit'][0] && 
            release['artist-credit'][0].name && release['artist-credit'][0].name[0]) {
          data.artist = release['artist-credit'][0].name[0];
          this.logger.log(`Found artist: ${data.artist}`);
        } else if (release['artist-credit'] && release['artist-credit'][0] && 
                  release['artist-credit'][0].artist && release['artist-credit'][0].artist[0] &&
                  release['artist-credit'][0].artist[0].name && release['artist-credit'][0].artist[0].name[0]) {
          data.artist = release['artist-credit'][0].artist[0].name[0];
          this.logger.log(`Found artist (alternative path): ${data.artist}`);
        }
        
        // Extract release date
        if (release.date && release.date[0]) {
          data.releaseDate = release.date[0];
          this.logger.log(`Found release date: ${data.releaseDate}`);
        }
        
        // Extract track listing
        const mediumList = release['medium-list']?.[0];
        if (!mediumList) {
          this.logger.warn('No medium-list found in release');
          return data;
        }
        
        const medium = mediumList.medium?.[0];
        if (!medium) {
          this.logger.warn('No medium found in medium-list');
          return data;
        }
        
        const trackList = medium['track-list']?.[0];
        if (!trackList) {
          this.logger.warn('No track-list found in medium');
          return data;
        }
        
        const tracks = trackList.track || [];
        this.logger.log(`Found ${tracks.length} tracks`);
        
        data.tracklist = tracks.map(track => {
          try {
            return track.recording[0].title[0];
          } catch (e) {
            this.logger.warn(`Could not extract title for track`, { track });
            return 'Unknown Track';
          }
        });
        
        this.logger.log(`Successfully extracted ${data.tracklist.length} track titles`);
      } catch (parseError) {
        this.logger.error('Error parsing data from response', parseError);
      }
      
      return data;
    } catch (error) {
      this.logger.error('Error fetching MusicBrainz data', { 
        mbid, 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.error('API Error Response', { 
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // The request was made but no response was received
        this.logger.error('No response received', { request: error.request });
      } else {
        // Something happened in setting up the request that triggered an Error
        this.logger.error('Request setup error', { message: error.message });
      }
      
      return { tracklist: [] };
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

    // If MBID is provided, fetch record data from MusicBrainz
    const recordData: EnhancedCreateRecordDto = { 
      ...createRecordDto,
      tracklist: [] // Always initialize with empty array
    };
    
    if (createRecordDto.mbid) {
      this.logger.log(`Fetching record data for new record with MBID: ${createRecordDto.mbid}`);
      
      const mbData = await this.fetchMusicBrainzData(createRecordDto.mbid);
      this.logger.log(`Fetched ${mbData.tracklist.length} tracks`);
      
      // Use tracklist from MusicBrainz
      recordData.tracklist = mbData.tracklist;
      
      // If artist or album is not provided in DTO, use data from MusicBrainz
      if (!createRecordDto.artist && mbData.artist) {
        this.logger.log(`Using artist from MusicBrainz: ${mbData.artist}`);
        recordData.artist = mbData.artist;
      }
      
      if (!createRecordDto.album && mbData.album) {
        this.logger.log(`Using album from MusicBrainz: ${mbData.album}`);
        recordData.album = mbData.album;
      }
    }

    const record = new this.recordModel({
      ...recordData,
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

    // If artist, album, or format is being updated, check for duplicates
    if (updateRecordDto.artist || updateRecordDto.album || updateRecordDto.format) {
      const artist = updateRecordDto.artist || record.artist;
      const album = updateRecordDto.album || record.album;
      const format = updateRecordDto.format || record.format;

      // Check if a record with these values already exists (excluding the current record)
      const existingRecord = await this.recordModel.findOne({
        _id: { $ne: id },
        artist,
        album,
        format
      });

      if (existingRecord) {
        throw new BadRequestException(
          `A record with artist "${artist}", album "${album}", and format "${format}" already exists`
        );
      }
    }

    // If MBID is updated, fetch new record data
    const recordUpdates: EnhancedUpdateRecordDto = { 
      ...updateRecordDto,
      tracklist: record.tracklist || [] // Maintain the existing tracklist
    };
    
    if (updateRecordDto.mbid && updateRecordDto.mbid !== record.mbid) {
      this.logger.log(`MBID changed from ${record.mbid} to ${updateRecordDto.mbid}. Fetching new record data.`);
      
      const mbData = await this.fetchMusicBrainzData(updateRecordDto.mbid);
      this.logger.log(`Fetched ${mbData.tracklist.length} tracks for updated MBID`);
      
      // Always update tracklist when MBID changes
      recordUpdates.tracklist = mbData.tracklist;
      
      // Only update artist and album if they weren't explicitly provided in the update DTO
      if (!updateRecordDto.artist && mbData.artist) {
        this.logger.log(`Using artist from MusicBrainz for update: ${mbData.artist}`);
        recordUpdates.artist = mbData.artist;
      }
      
      if (!updateRecordDto.album && mbData.album) {
        this.logger.log(`Using album from MusicBrainz for update: ${mbData.album}`);
        recordUpdates.album = mbData.album;
      }
    }

    const updatedRecord = await this.recordModel.findByIdAndUpdate(
      id,
      {
        ...recordUpdates,
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

  /**
   * Public method to test MusicBrainz integration
   * @param mbid MusicBrainz ID to test
   * @returns Track listings and status information
   */
  async testMusicBrainzIntegration(mbid: string) {
    this.logger.log(`Running MusicBrainz integration test for MBID: ${mbid}`);
    
    try {
      const start = Date.now();
      const data = await this.fetchMusicBrainzData(mbid);
      const duration = Date.now() - start;
      
      return {
        success: true,
        mbid,
        artist: data.artist,
        album: data.album,
        releaseDate: data.releaseDate,
        tracks: data.tracklist,
        count: data.tracklist.length,
        durationMs: duration,
      };
    } catch (error) {
      this.logger.error('Error in MusicBrainz test', { error });
      return {
        success: false,
        mbid,
        error: error.message,
        tracks: [],
        count: 0
      };
    }
  }
}

