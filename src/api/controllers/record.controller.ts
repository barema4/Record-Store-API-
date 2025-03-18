import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { RecordService } from '../services/record.service';
import { CreateRecordDto, UpdateRecordDto } from '../dtos/record.dto';
import { RecordResponseDto, PaginatedRecordResponseDto } from '../dtos/record.response.dto';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';

@ApiTags('records')
@Controller('records')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new record',
    description: 'Creates a new record in the store. If an MBID is provided, it will fetch the track listing from MusicBrainz.'
  })
  @ApiBody({ type: CreateRecordDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Record successfully created.',
    type: RecordResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid data or record already exists.'
  })
  async create(@Body() createRecordDto: CreateRecordDto): Promise<RecordResponseDto> {
    return this.recordService.create(createRecordDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all records with filters',
    description: 'Retrieves records with optional filtering, pagination, and sorting.'
  })
  @ApiQuery({ name: 'artist', required: false, description: 'Filter by artist name (case-insensitive)' })
  @ApiQuery({ name: 'album', required: false, description: 'Filter by album name (case-insensitive)' })
  @ApiQuery({ name: 'format', required: false, enum: RecordFormat, description: 'Filter by record format' })
  @ApiQuery({ name: 'category', required: false, enum: RecordCategory, description: 'Filter by record category' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean, description: 'Filter for records in stock' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Records per page (default: 10)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by (default: lastModified)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: desc)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated records matching the criteria.',
    type: PaginatedRecordResponseDto
  })
  async findAll(@Query() query: any): Promise<PaginatedRecordResponseDto> {
    return this.recordService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get a record by ID',
    description: 'Retrieves detailed information about a specific record.'
  })
  @ApiParam({ name: 'id', description: 'Record ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the record.',
    type: RecordResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Record not found.'
  })
  async findOne(@Param('id') id: string): Promise<RecordResponseDto> {
    return this.recordService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update a record',
    description: 'Updates a record. If MBID is changed, it will fetch new track listing from MusicBrainz.'
  })
  @ApiParam({ name: 'id', description: 'Record ID' })
  @ApiBody({ type: UpdateRecordDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Record successfully updated.',
    type: RecordResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Record not found.'
  })
  async update(
    @Param('id') id: string, 
    @Body() updateRecordDto: UpdateRecordDto
  ): Promise<RecordResponseDto> {
    return this.recordService.update(id, updateRecordDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete a record',
    description: 'Removes a record from the store.'
  })
  @ApiParam({ name: 'id', description: 'Record ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Record successfully deleted.'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Record not found.'
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.recordService.delete(id);
  }

  @Get('test-musicbrainz/:mbid')
  @ApiOperation({ 
    summary: 'Test MusicBrainz Integration',
    description: 'Tests the MusicBrainz API integration by fetching detailed information for a given MBID'
  })
  @ApiParam({ name: 'mbid', description: 'MusicBrainz ID to test' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully fetched record information',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        mbid: { type: 'string' },
        artist: { 
          type: 'string',
          description: 'Artist name retrieved from MusicBrainz',
          nullable: true
        },
        album: { 
          type: 'string', 
          description: 'Album title retrieved from MusicBrainz',
          nullable: true
        },
        releaseDate: { 
          type: 'string', 
          description: 'Release date retrieved from MusicBrainz',
          nullable: true
        },
        tracks: { 
          type: 'array',
          items: { type: 'string' },
          description: 'Track listing retrieved from MusicBrainz'
        },
        count: { 
          type: 'number',
          description: 'Number of tracks found'
        },
        durationMs: { 
          type: 'number',
          description: 'Time taken to fetch the data in milliseconds'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Failed to fetch record information',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        mbid: { type: 'string' },
        error: { type: 'string', description: 'Error message' },
        tracks: { type: 'array', items: { type: 'string' }, description: 'Empty array' },
        count: { type: 'number', example: 0 }
      }
    }
  })
  async testMusicBrainz(@Param('mbid') mbid: string) {
    return this.recordService.testMusicBrainzIntegration(mbid);
  }
}

