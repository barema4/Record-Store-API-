import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RecordFormat, RecordCategory } from '../src/api/schemas/record.enum';
import { Connection } from 'mongoose';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let createdRecordId: string;
  let dbConnection: Connection;

  beforeAll(async () => {
    // Override the MongoDB URL to use a test database
    process.env.MONGO_URL = 'mongodb://localhost:27017/records_test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get the database connection
    dbConnection = app.get('DatabaseConnection');
  });

  afterAll(async () => {
    // Clean up the test database
    if (dbConnection) {
      await dbConnection.dropDatabase();
    }
    await app.close();
  });

  describe('Records API', () => {
    it('should create a new record', async () => {
      const createRecordDto = {
        artist: 'Test Artist',
        album: 'Test Album',
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        price: 29.99,
        qty: 10,
        stockQuantity: 10,
        mbid: 'bf584cf2-dc33-433e-b8b2-b85578822726'
      };

      const response = await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.artist).toBe(createRecordDto.artist);
      expect(response.body.album).toBe(createRecordDto.album);
      createdRecordId = response.body.id;
    });

    it('should get all records', async () => {
      const response = await request(app.getHttpServer())
        .get('/records')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });

    it('should get a record by id', async () => {
      if (!createdRecordId) {
        throw new Error('No record ID available for testing');
      }

      const response = await request(app.getHttpServer())
        .get(`/records/${createdRecordId}`)
        .expect(200);

      expect(response.body.id).toBe(createdRecordId);
    });

    it('should update a record', async () => {
      if (!createdRecordId) {
        throw new Error('No record ID available for testing');
      }

      const updateRecordDto = {
        price: 34.99,
        qty: 15,
        stockQuantity: 15
      };

      const response = await request(app.getHttpServer())
        .put(`/records/${createdRecordId}`)
        .send(updateRecordDto)
        .expect(200);

      expect(response.body.price).toBe(updateRecordDto.price);
      expect(response.body.qty).toBe(updateRecordDto.qty);
    });

    it('should delete a record', async () => {
      if (!createdRecordId) {
        throw new Error('No record ID available for testing');
      }

      await request(app.getHttpServer())
        .delete(`/records/${createdRecordId}`)
        .expect(200);
    });
  });

  describe('Orders API', () => {
    let orderId: string;
    let recordId: string;

    beforeEach(async () => {
      // Create a record for testing orders
      const createRecordDto = {
        artist: 'Order Test Artist',
        album: 'Order Test Album',
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        price: 29.99,
        qty: 10,
        stockQuantity: 10,
        mbid: 'bf584cf2-dc33-433e-b8b2-b85578822726'
      };

      const recordResponse = await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto);

      recordId = recordResponse.body.id;
    });

    it('should create a new order', async () => {
      if (!recordId) {
        throw new Error('No record ID available for testing');
      }

      const createOrderDto = {
        recordId,
        quantity: 2,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        shippingAddress: '123 Test St'
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.recordId).toBe(recordId);
      expect(response.body.quantity).toBe(createOrderDto.quantity);
      orderId = response.body.id;
    });

    it('should get all orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });

    it('should get an order by id', async () => {
      if (!orderId) {
        throw new Error('No order ID available for testing');
      }

      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .expect(200);

      expect(response.body.id).toBe(orderId);
    });

    it('should create a new record and fetch it with filters', async () => {
        const createRecordDto = {
          artist: 'The Fake Band',
          album: 'Fake Album',
          price: 25,
          qty: 10,
          format: RecordFormat.VINYL,
          category: RecordCategory.ROCK,
          mbid: 'bf584cf2-dc33-433e-b8b2-b85578822726'
        };
    
        const createResponse = await request(app.getHttpServer())
          .post('/records')
          .send(createRecordDto)
          .expect(201);
    
        recordId = createResponse.body.id;
    
        const response = await request(app.getHttpServer())
          .get('/records?artist=The Fake Band')
          .expect(200);
    
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toHaveProperty('artist', 'The Fake Band');
      });

    afterEach(async () => {
      // Clean up the test record
      if (recordId) {
        await request(app.getHttpServer())
          .delete(`/records/${recordId}`);
      }
    });
  });
}); 