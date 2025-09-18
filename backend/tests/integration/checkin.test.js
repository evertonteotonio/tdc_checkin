const request = require('supertest');
const express = require('express');
const checkinRoutes = require('../../src/routes/checkin');

const app = express();
app.use(express.json());
app.use('/api/checkin', checkinRoutes);

describe('Checkin API', () => {
  const mockParticipant = {
    id: 'test-participant-id',
    name: 'João Silva',
    email: 'joao@test.com',
    company: 'Tech Corp',
    type: 'GUEST'
  };

  describe('POST /api/checkin/face', () => {
    it('should perform face checkin successfully', async () => {
      // Mock DynamoDB to return participant
      const mockDynamoDB = require('aws-sdk').DynamoDB.DocumentClient();
      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Item: mockParticipant })
      });
      
      // Mock no existing checkin today
      mockDynamoDB.query.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] })
      });

      const response = await request(app)
        .post('/api/checkin/face')
        .attach('photo', Buffer.from('fake-image'), 'test.jpg');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('participant');
      expect(response.body).toHaveProperty('checkin');
      expect(response.body).toHaveProperty('greeting');
      expect(response.body.participant.id).toBe('test-participant-id');
    });

    it('should return error for unrecognized face', async () => {
      // Mock Rekognition to return no matches
      const mockRekognition = require('aws-sdk').Rekognition();
      mockRekognition.searchFacesByImage.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ FaceMatches: [] })
      });

      const response = await request(app)
        .post('/api/checkin/face')
        .attach('photo', Buffer.from('fake-image'), 'test.jpg');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('não reconhecida');
    });

    it('should return error for duplicate checkin', async () => {
      // Mock existing checkin today
      const mockDynamoDB = require('aws-sdk').DynamoDB.DocumentClient();
      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Item: mockParticipant })
      });
      mockDynamoDB.query.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ id: 'existing-checkin', timestamp: new Date().toISOString() }]
        })
      });

      const response = await request(app)
        .post('/api/checkin/face')
        .attach('photo', Buffer.from('fake-image'), 'test.jpg');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('já fez check-in');
    });
  });

  describe('POST /api/checkin/manual', () => {
    it('should perform manual checkin successfully', async () => {
      // Mock DynamoDB to return participant by email
      const mockDynamoDB = require('aws-sdk').DynamoDB.DocumentClient();
      mockDynamoDB.query.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [mockParticipant] })
      });

      const response = await request(app)
        .post('/api/checkin/manual')
        .send({ email: 'joao@test.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('participant');
      expect(response.body).toHaveProperty('checkin');
      expect(response.body.checkin.method).toBe('MANUAL');
    });

    it('should return error for non-existent email', async () => {
      // Mock DynamoDB to return no participants
      const mockDynamoDB = require('aws-sdk').DynamoDB.DocumentClient();
      mockDynamoDB.query.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] })
      });

      const response = await request(app)
        .post('/api/checkin/manual')
        .send({ email: 'nonexistent@test.com' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('não encontrado');
    });

    it('should return error for missing email', async () => {
      const response = await request(app)
        .post('/api/checkin/manual')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/checkin/assistance', () => {
    it('should provide assistance successfully', async () => {
      const response = await request(app)
        .post('/api/checkin/assistance')
        .send({
          query: 'Onde fica o banheiro?',
          participantId: 'test-participant-id'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('response');
      expect(typeof response.body.response).toBe('string');
    });

    it('should return error for missing query', async () => {
      const response = await request(app)
        .post('/api/checkin/assistance')
        .send({ participantId: 'test-participant-id' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
