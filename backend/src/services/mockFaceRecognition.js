const { s3 } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class MockFaceRecognitionService {
  constructor() {
    this.bucket = process.env.S3_BUCKET || 'event-photos';
    // Simular banco de faces em memória
    this.faceDatabase = new Map();
  }

  async indexFace(imageBuffer, participantId) {
    try {
      // Upload da imagem para S3
      const imageKey = `participants/${participantId}/${uuidv4()}.jpg`;
      
      await s3.upload({
        Bucket: this.bucket,
        Key: imageKey,
        Body: imageBuffer,
        ContentType: 'image/jpeg'
      }).promise();

      // Simular processamento de face
      const faceId = uuidv4();
      const faceHash = this.generateFaceHash(imageBuffer);
      
      // Armazenar no "banco" de faces
      this.faceDatabase.set(faceHash, {
        faceId,
        participantId,
        confidence: 95.5
      });

      console.log(`Mock: Face indexed for participant ${participantId}`);

      return {
        faceId,
        imageKey,
        confidence: 95.5
      };
    } catch (error) {
      console.error('Error in mock face indexing:', error);
      throw new Error(`Erro ao processar imagem: ${error.message}`);
    }
  }

  async searchFace(imageBuffer) {
    try {
      // Simular busca de face
      const faceHash = this.generateFaceHash(imageBuffer);
      
      // Buscar face similar (simulação)
      const match = this.faceDatabase.get(faceHash);
      
      if (match) {
        console.log(`Mock: Face found for participant ${match.participantId}`);
        return {
          participantId: match.participantId,
          confidence: match.confidence,
          faceId: match.faceId
        };
      }

      // Simular busca por similaridade (para demo)
      // Em um cenário real, usaríamos algoritmos de comparação facial
      const allFaces = Array.from(this.faceDatabase.values());
      if (allFaces.length > 0) {
        // Retornar uma face aleatória para demonstração
        const randomMatch = allFaces[Math.floor(Math.random() * allFaces.length)];
        console.log(`Mock: Random face match for demo - participant ${randomMatch.participantId}`);
        return {
          participantId: randomMatch.participantId,
          confidence: 87.3, // Confiança menor para match simulado
          faceId: randomMatch.faceId
        };
      }

      console.log('Mock: No face match found');
      return null;
    } catch (error) {
      console.error('Error in mock face search:', error);
      throw new Error(`Erro ao buscar face: ${error.message}`);
    }
  }

  async deleteFace(faceId) {
    try {
      // Simular deleção
      for (const [hash, data] of this.faceDatabase.entries()) {
        if (data.faceId === faceId) {
          this.faceDatabase.delete(hash);
          console.log(`Mock: Face ${faceId} deleted`);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error deleting face:', error);
      throw new Error(`Erro ao deletar face: ${error.message}`);
    }
  }

  // Gerar hash simples da imagem para simulação
  generateFaceHash(imageBuffer) {
    return crypto.createHash('md5').update(imageBuffer).digest('hex').substring(0, 16);
  }

  // Método para debug - listar todas as faces
  listFaces() {
    return Array.from(this.faceDatabase.values());
  }
}

module.exports = new MockFaceRecognitionService();
