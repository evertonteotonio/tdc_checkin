const faceRecognition = require('../../src/services/faceRecognition');

describe('Face Recognition Service', () => {
  const mockImageBuffer = Buffer.from('fake-image-data');
  const mockParticipantId = 'test-participant-123';

  describe('indexFace', () => {
    it('should index face successfully', async () => {
      const result = await faceRecognition.indexFace(mockImageBuffer, mockParticipantId);

      expect(result).toBe('test-face-id');
      
      const mockRekognition = require('aws-sdk').Rekognition();
      expect(mockRekognition.indexFaces).toHaveBeenCalledWith({
        CollectionId: 'test-collection',
        Image: { Bytes: mockImageBuffer },
        ExternalImageId: mockParticipantId,
        DetectionAttributes: ['ALL']
      });
    });

    it('should throw error when no face detected', async () => {
      const mockRekognition = require('aws-sdk').Rekognition();
      mockRekognition.indexFaces.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ FaceRecords: [] })
      });

      await expect(faceRecognition.indexFace(mockImageBuffer, mockParticipantId))
        .rejects.toThrow('Nenhuma face detectada na imagem');
    });
  });

  describe('searchFace', () => {
    it('should find matching face', async () => {
      const result = await faceRecognition.searchFace(mockImageBuffer);

      expect(result).toEqual({
        participantId: 'test-participant-id',
        confidence: 99.9
      });

      const mockRekognition = require('aws-sdk').Rekognition();
      expect(mockRekognition.searchFacesByImage).toHaveBeenCalledWith({
        CollectionId: 'test-collection',
        Image: { Bytes: mockImageBuffer },
        MaxFaces: 1,
        FaceMatchThreshold: 80
      });
    });

    it('should return null when no face matches', async () => {
      const mockRekognition = require('aws-sdk').Rekognition();
      mockRekognition.searchFacesByImage.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ FaceMatches: [] })
      });

      const result = await faceRecognition.searchFace(mockImageBuffer);

      expect(result).toBeNull();
    });

    it('should return null when confidence is too low', async () => {
      const mockRekognition = require('aws-sdk').Rekognition();
      mockRekognition.searchFacesByImage.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          FaceMatches: [{ Face: { ExternalImageId: 'test-id' }, Similarity: 70 }]
        })
      });

      const result = await faceRecognition.searchFace(mockImageBuffer);

      expect(result).toBeNull();
    });
  });
});
