import { IsString, IsNumber, Min, IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID of the record being ordered'
  })
  @IsString()
  @IsNotEmpty()
  recordId: string;

  @ApiProperty({
    example: 1,
    description: 'Number of records to order',
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 'Sam Ru',
    description: 'Name of the customer'
  })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({
    example: 'sam.ru@gmail.com',
    description: 'Email address of the customer'
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @ApiProperty({
    example: '123 Main St, City, Country',
    description: 'Shipping address for the order'
  })
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;
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

  @ApiProperty({ example: 'Sam Ru' })
  customerName: string;

  @ApiProperty({ example: 'sam.ru@gmail.com' })
  customerEmail: string;

  @ApiProperty({ example: '123 Main St, City, Country' })
  shippingAddress: string;
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