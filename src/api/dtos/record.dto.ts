import { IsString, IsNumber, IsEnum, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';
import { NoWhitespace } from '../decorators/no-whitespace.decorator';

export class CreateRecordDto {
  @ApiProperty({
    example: 'The Beatles',
    description: 'Name of the artist/band'
  })
  @IsString()
  @IsNotEmpty()
  @NoWhitespace()
  artist: string;

  @ApiProperty({
    example: 'Abbey Road',
    description: 'Name of the album'
  })
  @IsString()
  @IsNotEmpty()
  @NoWhitespace()
  album: string;

  @ApiProperty({
    example: 29.99,
    description: 'Price of the record',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 5,
    description: 'Quantity in stock',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  qty: number;

  @ApiProperty({
    enum: RecordFormat,
    example: RecordFormat.VINYL,
    description: 'Format of the record'
  })
  @IsEnum(RecordFormat)
  @IsNotEmpty()
  format: RecordFormat;

  @ApiProperty({
    enum: RecordCategory,
    example: RecordCategory.ROCK,
    description: 'Genre/category of the record'
  })
  @IsEnum(RecordCategory)
  @IsNotEmpty()
  category: RecordCategory;

  @ApiProperty({
    example: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
    description: 'MusicBrainz Identifier - used to fetch track listings',
    required: false
  })
  @IsString()
  @IsOptional()
  @NoWhitespace()
  mbid?: string;
}

export class UpdateRecordDto {
  @ApiProperty({
    example: 'The Beatles',
    description: 'Name of the artist/band',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @NoWhitespace()
  artist?: string;

  @ApiProperty({
    example: 'Abbey Road',
    description: 'Name of the album',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @NoWhitespace()
  album?: string;

  @ApiProperty({
    example: 29.99,
    description: 'Price of the record',
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    example: 5,
    description: 'Quantity in stock',
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  qty?: number;

  @ApiProperty({
    enum: RecordFormat,
    example: RecordFormat.VINYL,
    description: 'Format of the record',
    required: false
  })
  @IsEnum(RecordFormat)
  @IsNotEmpty()
  @IsOptional()
  format?: RecordFormat;

  @ApiProperty({
    enum: RecordCategory,
    example: RecordCategory.ROCK,
    description: 'Genre/category of the record',
    required: false
  })
  @IsEnum(RecordCategory)
  @IsNotEmpty()
  @IsOptional()
  category?: RecordCategory;

  @ApiProperty({
    example: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
    description: 'MusicBrainz Identifier - used to fetch track listings',
    required: false
  })
  @IsString()
  @IsOptional()
  @NoWhitespace()
  mbid?: string;
} 