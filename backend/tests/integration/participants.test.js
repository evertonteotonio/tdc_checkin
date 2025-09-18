const request = require('supertest');
const express = require('express');
const participantRoutes = require('../../src/routes/participants');

const app = express();
app.use(express.json());
app.use('/api/participants', participantRoutes);

describe('Participants API', () => {
  describe('POST /api/participants/register', () => {
    it('should register participant successfully', async () => {
      const participantData = {
        name: 'João Silva',
        email: 'joao@test.com',
        company: 'Tech Corp',
        type: 'GUEST',
        phone: '11999999999',
        position: 'Developer'
      };

      const response = await request(app)
        .post('/api/participants/register')
        .field('name', participantData.name)
        .field('email', participantData.email)
        .field('company', participantData.company)
        .field('type', participantData.type)
        .field('phone', participantData.phone)
        .field('position', participantData.position)
        .attach('photo', Buffer.from('fake-image'), 'test.jpg');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('participant');
      expect(response.body.participant.name).toBe(participantData.name);
      expect(response.body.participant.email).toBe(participantData.email);
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/participants/register')
        .field('name', 'João Silva')
        .attach('photo', Buffer.from('fake-image'), 'test.jpg');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return error for missing photo', async () => {
      const response = await request(app)
        .post('/api/participants/register')
        .field('name', 'João Silva')
        .field('email', 'joao@test.com')
        .field('company', 'Tech Corp');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return error for duplicate email', async () => {
      // Mock DynamoDB to return existing participant
      const mockDynamoDB = require('aws-sdk').DynamoDB.DocumentClient();
      mockDynamoDB.query.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ id: 'existing-id', email: 'joao@test.com' }]
        })
      });

      const response = await request(app)
        .post('/api/participants/register')
        .field('name', 'João Silva')
        .field('email', 'joao@test.com')
        .field('company', 'Tech Corp')
        .attach('photo', Buffer.from('fake-image'), 'test.jpg');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('já cadastrado');
    });
  });

  describe('GET /api/participants/:id', () => {
    it('should get participant by id', async () => {
      const mockParticipant = {
        id: 'test-id',
        name: 'João Silva',
        email: 'joao@test.com',
        company: 'Tech Corp'
      };

      const mockDynamoDB = require('aws-sdk').DynamoDB.DocumentClient();
      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Item: mockParticipant })
      });

      const response = await request(app)
        .get('/api/participants/test-id');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.participant.id).toBe('test-id');
    });

    it('should return 404 for non-existent participant', async () => {
      const mockDynamoDB = require('aws-sdk').DynamoDB.DocumentClient();
      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const response = await request(app)
        .get('/api/participants/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
