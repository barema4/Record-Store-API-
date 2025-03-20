import { IsString, IsNumber, IsEmail, IsNotEmpty, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NoWhitespace } from '../decorators/no-whitespace.decorator';

export class CreateOrderDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID of the record to order'
  })
  @IsString()
  @IsNotEmpty()
  @NoWhitespace()
  recordId: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity of records to order',
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the customer'
  })
  @IsString()
  @IsNotEmpty()
  @NoWhitespace()
  customerName: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address of the customer'
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @NoWhitespace()
  customerEmail: string;

  @ApiProperty({
    example: '123 Main St, City, Country',
    description: 'Shipping address for the order'
  })
  @IsString()
  @IsNotEmpty()
  @NoWhitespace()
  shippingAddress: string;
}

export class OrderResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Unique identifier of the order'
  })
  id: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'ID of the ordered record'
  })
  recordId: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity of records ordered'
  })
  quantity: number;

  @ApiProperty({
    example: 59.98,
    description: 'Total price of the order'
  })
  totalPrice: number;

  @ApiProperty({
    example: '2023-09-14T10:00:00.000Z',
    description: 'Date when the order was placed'
  })
  orderDate: Date;

  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the customer'
  })
  customerName: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address of the customer'
  })
  customerEmail: string;

  @ApiProperty({
    example: '123 Main St, City, Country',
    description: 'Shipping address for the order'
  })
  shippingAddress: string;
}

export class PaginatedOrderResponseDto {
  @ApiProperty({
    type: [OrderResponseDto],
    description: 'Array of orders'
  })
  data: OrderResponseDto[];

  @ApiProperty({
    example: 1,
    description: 'Current page number'
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page'
  })
  limit: number;

  @ApiProperty({
    example: 100,
    description: 'Total number of orders'
  })
  total: number;

  @ApiProperty({
    example: 10,
    description: 'Total number of pages'
  })
  totalPages: number;
} 