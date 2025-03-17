import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordController } from './controllers/record.controller';
import { RecordService } from './services/record.service';
import { Record, RecordSchema } from './schemas/record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Record.name, schema: RecordSchema },]),
  ],
  controllers: [RecordController],
  providers: [RecordService],
})
export class RecordModule {}
