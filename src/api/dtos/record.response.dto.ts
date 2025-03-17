import { ApiProperty } from '@nestjs/swagger';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';

export class RecordResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'The Beatles' })
  artist: string;

  @ApiProperty({ example: 'Abbey Road' })
  album: string;

  @ApiProperty({ example: 29.99 })
  price: number;

  @ApiProperty({ example: 5 })
  qty: number;

  @ApiProperty({ 
    enum: RecordFormat,
    example: RecordFormat.VINYL,
    description: 'Format of the record (Vinyl, CD, Cassette, or Digital)'
  })
  format: RecordFormat;

  @ApiProperty({ 
    enum: RecordCategory,
    example: RecordCategory.ROCK,
    description: 'Genre/category of the record'
  })
  category: RecordCategory;

  @ApiProperty({ example: '2024-03-16T10:30:00.000Z' })
  created: Date;

  @ApiProperty({ example: '2024-03-16T10:30:00.000Z' })
  lastModified: Date;

  @ApiProperty({ 
    example: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
    description: 'MusicBrainz Identifier',
    required: false
  })
  mbid?: string;

  @ApiProperty({
    example: ['Come Together', 'Something', 'Maxwell\'s Silver Hammer'],
    description: 'List of tracks on the record',
    type: [String]
  })
  tracklist: string[];
}

export class PaginatedRecordResponseDto {
  @ApiProperty({ type: [RecordResponseDto] })
  data: RecordResponseDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
} 