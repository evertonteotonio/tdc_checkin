const { rekognition, s3 } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

class FaceRecognitionService {
  constructor() {
    this.collectionId = process.env.REKOGNITION_COLLECTION || 'event-faces';
    this.bucket = process.env.S3_BUCKET || 'event-photos';
  }

  async ensureCollectionExists() {
    try {
      await rekognition.describeCollection({
        CollectionId: this.collectionId
      }).promise();
      console.log(`Rekognition collection ${this.collectionId} exists`);
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        console.log(`Creating Rekognition collection: ${this.collectionId}`);
        await rekognition.createCollection({
          CollectionId: this.collectionId
        }).promise();
        console.log(`Rekognition collection ${this.collectionId} created`);
      } else {
        throw error;
      }
    }
  }

  async indexFace(imageBuffer, participantId) {
    try {
      await this.ensureCollectionExists();

      // Upload da imagem para S3
      const imageKey = `participants/${participantId}/${uuidv4()}.jpg`;
      
      await s3.upload({
        Bucket: this.bucket,
        Key: imageKey,
        Body: imageBuffer,
        ContentType: 'image/jpeg'
      }).promise();

      // Indexar face no Rekognition
      const result = await rekognition.indexFaces({
        CollectionId: this.collectionId,
        Image: {
          Bytes: imageBuffer
        },
        ExternalImageId: participantId,
        MaxFaces: 1,
        QualityFilter: 'AUTO',
        DetectionAttributes: ['ALL']
      }).promise();

      if (result.FaceRecords.length === 0) {
        throw new Error('Nenhuma face detectada na imagem');
      }

      console.log(`Face indexed for participant ${participantId} with confidence ${result.FaceRecords[0].Face.Confidence}`);

      return {
        faceId: result.FaceRecords[0].Face.FaceId,
        imageKey,
        confidence: result.FaceRecords[0].Face.Confidence
      };
    } catch (error) {
      console.error('Error indexing face:', error);
      throw new Error(`Erro ao processar imagem: ${error.message}`);
    }
  }

  async searchFace(imageBuffer) {
    try {
      await this.ensureCollectionExists();

      const result = await rekognition.searchFacesByImage({
        CollectionId: this.collectionId,
        Image: {
          Bytes: imageBuffer
        },
        MaxFaces: 1,
        FaceMatchThreshold: 80
      }).promise();

      if (result.FaceMatches.length === 0) {
        console.log('No face matches found');
        return null;
      }

      const match = result.FaceMatches[0];
      console.log(`Face match found for participant ${match.Face.ExternalImageId} with confidence ${match.Similarity}`);
      
      return {
        participantId: match.Face.ExternalImageId,
        confidence: match.Similarity,
        faceId: match.Face.FaceId
      };
    } catch (error) {
      console.error('Error searching face:', error);
      throw new Error(`Erro ao buscar face: ${error.message}`);
    }
  }

  async deleteFace(faceId) {
    try {
      await rekognition.deleteFaces({
        CollectionId: this.collectionId,
        FaceIds: [faceId]
      }).promise();
      
      console.log(`Face ${faceId} deleted from collection`);
      return true;
    } catch (error) {
      console.error('Error deleting face:', error);
      throw new Error(`Erro ao deletar face: ${error.message}`);
    }
  }

  async listFaces() {
    try {
      const result = await rekognition.listFaces({
        CollectionId: this.collectionId,
        MaxResults: 100
      }).promise();
      
      return result.Faces;
    } catch (error) {
      console.error('Error listing faces:', error);
      return [];
    }
  }
}

module.exports = new FaceRecognitionService();
