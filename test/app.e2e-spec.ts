import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
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
    beforeEach(async () => {
      // Create a record for testing
      const createRecordDto = {
        artist: `Test Artist ${Date.now()}`, // Make artist unique
        album: `Test Album ${Date.now()}`, // Make album unique
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        price: 29.99,
        qty: 10,
        mbid: 'bf584cf2-dc33-433e-b8b2-b85578822726'
      };

      const response = await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto);

      createdRecordId = response.body.id;
    });

    afterEach(async () => {
      // Clean up the test record
      if (createdRecordId) {
        await request(app.getHttpServer())
          .delete(`/records/${createdRecordId}`);
      }
    });

    it('should create a new record', async () => {
      const createRecordDto = {
        artist: `Test Artist ${Date.now()}`, // Make artist unique
        album: `Test Album ${Date.now()}`, // Make album unique
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        price: 29.99,
        qty: 10,
        mbid: 'bf584cf2-dc33-433e-b8b2-b85578822726'
      };

      const response = await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.artist).toBe(createRecordDto.artist);
      expect(response.body.album).toBe(createRecordDto.album);
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
      const response = await request(app.getHttpServer())
        .get(`/records/${createdRecordId}`)
        .expect(200);

      expect(response.body.id).toBe(createdRecordId);
    });

    it('should update a record', async () => {
      const updateRecordDto = {
        price: 34.99,
        qty: 15
      };

      const response = await request(app.getHttpServer())
        .put(`/records/${createdRecordId}`)
        .send(updateRecordDto)
        .expect(200);

      expect(response.body.price).toBe(updateRecordDto.price);
      expect(response.body.qty).toBe(updateRecordDto.qty);
    });

    it('should delete a record', async () => {
      await request(app.getHttpServer())
        .delete(`/records/${createdRecordId}`)
        .expect(200);
    });

    describe('Error Handling', () => {
      it('should return 400 when creating a record with invalid data', async () => {
        const invalidRecordDto = {
          // Missing required fields
          album: '',
          format: 'INVALID_FORMAT',
          category: 'INVALID_CATEGORY',
          price: -10,
          qty: -5,
          mbid: 'invalid-mbid'
        };

        const response = await request(app.getHttpServer())
          .post('/records')
          .send(invalidRecordDto)
          .expect(400);

        expect(response.body.message).toEqual(expect.arrayContaining([
          'artist should not be empty',
          'price must not be less than 0',
          'qty must not be less than 0'
        ]));
        expect(response.body.error).toBe('Bad Request');
      });

      it('should return 404 when fetching a non-existent record', async () => {
        const nonExistentId = '507f1f77bcf86cd799439011';

        const response = await request(app.getHttpServer())
          .get(`/records/${nonExistentId}`)
          .expect(404);

        expect(response.body.message).toBe('Record not found');
        expect(response.body.error).toBe('Not Found');
      });

      it('should return 400 when updating a record with invalid data', async () => {
        const invalidUpdateDto = {
          price: -20,
          qty: -10
        };

        const response = await request(app.getHttpServer())
          .put(`/records/${createdRecordId}`)
          .send(invalidUpdateDto)
          .expect(400);

        expect(response.body.message).toEqual(expect.arrayContaining([
          'price must not be less than 0',
          'qty must not be less than 0'
        ]));
        expect(response.body.error).toBe('Bad Request');
      });

      it('should return 404 when deleting a non-existent record', async () => {
        const nonExistentId = '507f1f77bcf86cd799439011';

        const response = await request(app.getHttpServer())
          .delete(`/records/${nonExistentId}`)
          .expect(404);

        expect(response.body.message).toBe('Record not found');
        expect(response.body.error).toBe('Not Found');
      });

      it('should handle invalid pagination parameters', async () => {
        const response = await request(app.getHttpServer())
          .get('/records?page=-1&limit=0')
          .expect(200);

        // The service should handle invalid parameters by using defaults
        expect(response.body.page).toBeGreaterThanOrEqual(1);
        expect(response.body.limit).toBeGreaterThanOrEqual(1);
      });

      it('should handle invalid sort parameters', async () => {
        const response = await request(app.getHttpServer())
          .get('/records?sortBy=invalidField&sortOrder=invalid')
          .expect(200);

        expect(response.body.data).toBeDefined();
      });
    });
  });

  describe('Orders API', () => {
    let orderId: string;
    let recordId: string;

    beforeEach(async () => {
      // Create a record for testing orders
      const createRecordDto = {
        artist: `Order Test Artist ${Date.now()}`, // Make artist unique
        album: `Order Test Album ${Date.now()}`, // Make album unique
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        price: 29.99,
        qty: 10,
        mbid: 'bf584cf2-dc33-433e-b8b2-b85578822726'
      };

      const recordResponse = await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto);

      recordId = recordResponse.body.id;
    });

    afterEach(async () => {
      // Clean up the test record
      if (recordId) {
        await request(app.getHttpServer())
          .delete(`/records/${recordId}`);
      }
    });

    it('should create a new order', async () => {
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
      // Create an order first
      const createOrderDto = {
        recordId,
        quantity: 2,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        shippingAddress: '123 Test St'
      };

      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto);

      orderId = orderResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .expect(200);

      expect(response.body.id).toBe(orderId);
    });

    describe('Order Error Handling', () => {
      it('should return 400 when creating an order with invalid data', async () => {
        const invalidOrderDto = {
          recordId,
          quantity: -2,
          customerName: '',
          customerEmail: 'invalid-email',
          shippingAddress: ''
        };

        const response = await request(app.getHttpServer())
          .post('/orders')
          .send(invalidOrderDto)
          .expect(400);

        expect(response.body.message).toEqual(expect.arrayContaining([
          'quantity must not be less than 1',
          'customerName should not be empty',
          'customerEmail must be an email',
          'shippingAddress should not be empty'
        ]));
        expect(response.body.error).toBe('Bad Request');
      });

      it('should return 404 when creating an order with non-existent record', async () => {
        const nonExistentRecordId = '507f1f77bcf86cd799439011';
        const orderData = {
          recordId: nonExistentRecordId,
          quantity: 1,
          customerName: 'Sam Ru',
          customerEmail: 'john@example.com',
          shippingAddress: '123 Main St'
        };

        const response = await request(app.getHttpServer())
          .post('/orders')
          .send(orderData)
          .expect(404);

        expect(response.body.message).toBe(`Record with ID ${nonExistentRecordId} not found`);
        expect(response.body.error).toBe('Not Found');
      });

      it('should return 400 when order quantity exceeds available stock', async () => {
        const createOrderDto = {
          recordId,
          quantity: 20,
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
          shippingAddress: '123 Test St'
        };

        const response = await request(app.getHttpServer())
          .post('/orders')
          .send(createOrderDto)
          .expect(400);

        expect(response.body.message).toBeDefined();
        expect(response.body.error).toBe('Bad Request');
      });

      it('should return 404 when fetching a non-existent order', async () => {
        const nonExistentOrderId = '507f1f77bcf86cd799439011';

        const response = await request(app.getHttpServer())
          .get(`/orders/${nonExistentOrderId}`)
          .expect(404);

        expect(response.body.message).toBe('Order not found');
        expect(response.body.error).toBe('Not Found');
      });
    });
  });
}); 