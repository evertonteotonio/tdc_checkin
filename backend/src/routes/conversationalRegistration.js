const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const conversationalAgent = require('../services/conversationalAgent');
const { dynamodb, s3, rekognition } = require('../config/aws');
const faceRecognition = require('../services/faceRecognition');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Iniciar conversa de cadastro
router.post('/start', async (req, res) => {
  try {
    const sessionId = uuidv4();
    const response = await conversationalAgent.startRegistrationChat(sessionId);
    
    res.json({
      success: true,
      sessionId,
      response
    });
  } catch (error) {
    console.error('Erro ao iniciar chat:', error);
    res.status(500).json({
      error: 'Erro ao iniciar conversa de cadastro'
    });
  }
});

// Processar mensagem do usuário
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({
        error: 'SessionId e message são obrigatórios'
      });
    }

    const response = await conversationalAgent.processMessage(sessionId, message);
    
    res.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    res.status(500).json({
      error: 'Erro ao processar mensagem'
    });
  }
});

// Finalizar cadastro com dados coletados
router.post('/complete', upload.single('photo'), async (req, res) => {
  try {
    const { sessionId, registrationData } = req.body;
    
    if (!sessionId || !registrationData || !req.file) {
      return res.status(400).json({
        error: 'Dados incompletos para finalizar cadastro'
      });
    }

    const data = JSON.parse(registrationData);
    
    // Registrar participante diretamente
    const participantId = uuidv4();
    const imageKey = `participants/${participantId}.jpg`;
    
    // Upload da imagem para S3
    await s3.upload({
      Bucket: process.env.S3_BUCKET,
      Key: imageKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }).promise();

    // Indexar face no Rekognition
    const faceId = await faceRecognition.indexFace(req.file.buffer, participantId);
    
    // Salvar no DynamoDB
    const participant = {
      id: participantId,
      name: data.name,
      email: data.email,
      company: data.company,
      type: data.type || 'GUEST',
      phone: data.phone || '',
      position: data.position || '',
      imageKey,
      faceId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: process.env.PARTICIPANTS_TABLE,
      Item: participant
    }).promise();
    
    // Limpar sessão
    conversationalAgent.clearSession(sessionId);
    
    res.json({
      success: true,
      participant,
      message: 'Cadastro realizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao completar cadastro:', error);
    res.status(500).json({
      error: 'Erro ao finalizar cadastro: ' + error.message
    });
  }
});

// Processar captura de foto
router.post('/photo', upload.single('photo'), async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId || !req.file) {
      return res.status(400).json({
        error: 'SessionId e foto são obrigatórios'
      });
    }

    // Processar foto capturada
    const response = await conversationalAgent.processPhotoCapture(sessionId, req.file);
    
    // Se o cadastro foi completado, registrar o participante
    if (response.type === 'registration_complete' && response.data) {
      try {
        // Registrar participante diretamente
        const participantId = uuidv4();
        const imageKey = `participants/${participantId}.jpg`;
        
        // Upload da imagem para S3
        await s3.upload({
          Bucket: process.env.S3_BUCKET,
          Key: imageKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype
        }).promise();

        // Indexar face no Rekognition
        const faceId = await faceRecognition.indexFace(req.file.buffer, participantId);
        
        // Salvar no DynamoDB
        const participant = {
          id: participantId,
          name: response.data.name,
          email: response.data.email,
          company: response.data.company,
          type: response.data.type || 'GUEST',
          phone: response.data.phone || '',
          position: response.data.position || '',
          imageKey,
          faceId,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        };

        await dynamodb.put({
          TableName: process.env.PARTICIPANTS_TABLE,
          Item: participant
        }).promise();
        
        res.json({
          success: true,
          response: {
            ...response,
            registrationResult: { participant }
          }
        });
      } catch (regError) {
        console.error('Erro no registro final:', regError);
        res.status(500).json({
          error: 'Dados coletados, mas erro ao finalizar cadastro: ' + regError.message
        });
      }
    } else {
      res.json({
        success: true,
        response
      });
    }
  } catch (error) {
    console.error('Erro ao processar foto:', error);
    res.status(500).json({
      error: 'Erro ao processar foto'
    });
  }
});

module.exports = router;
