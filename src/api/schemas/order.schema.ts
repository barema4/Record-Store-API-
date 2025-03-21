import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Record } from './record.schema';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Record', required: true })
  recordId: Record;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ default: Date.now })
  orderDate: Date;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop({ required: true })
  shippingAddress: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Create indexes for commonly queried fields
OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ recordId: 1 });
OrderSchema.index({ customerEmail: 1 }); 