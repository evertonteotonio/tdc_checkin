// Setup global para testes
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.PARTICIPANTS_TABLE = 'test-participants';
process.env.CHECKINS_TABLE = 'test-checkins';
process.env.S3_BUCKET = 'test-bucket';
process.env.REKOGNITION_COLLECTION = 'test-collection';
process.env.BEDROCK_MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';
process.env.JWT_SECRET = 'test-secret';

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  config: {
    update: jest.fn(),
    credentials: {}
  },
  SharedIniFileCredentials: jest.fn(),
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      put: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      get: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      query: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: [] }) }),
      scan: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: [] }) })
    }))
  },
  S3: jest.fn(() => ({
    upload: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Location: 'test-url' }) })
  })),
  Rekognition: jest.fn(() => ({
    describeCollection: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ CollectionARN: 'test-arn' })
    }),
    createCollection: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ CollectionArn: 'test-arn' })
    }),
    indexFaces: jest.fn().mockReturnValue({ 
      promise: jest.fn().mockResolvedValue({ 
        FaceRecords: [{ Face: { FaceId: 'test-face-id' } }] 
      }) 
    }),
    searchFacesByImage: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        FaceMatches: [{ Face: { ExternalImageId: 'test-participant-id' }, Similarity: 99.9 }]
      })
    })
  })),
  BedrockRuntime: jest.fn(() => ({
    invokeModel: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        body: Buffer.from(JSON.stringify({
          content: [{ text: 'Olá! Bem-vindo ao evento!' }]
        }))
      })
    })
  }))
}));
