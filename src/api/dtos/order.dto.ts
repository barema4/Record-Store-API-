import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID of the record being ordered'
  })
  @IsString()
  recordId: string;

  @ApiProperty({
    example: 1,
    description: 'Number of records to order',
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class OrderResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  recordId: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 59.98 })
  totalPrice: number;

  @ApiProperty({ example: '2024-03-16T10:30:00.000Z' })
  orderDate: Date;
}

export class PaginatedOrderResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  data: OrderResponseDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
} 