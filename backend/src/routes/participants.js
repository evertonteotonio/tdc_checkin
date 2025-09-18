const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { dynamodb } = require('../config/aws');
const faceRecognitionService = require('../services/faceRecognition');

const router = express.Router();

// Schema de validação
const participantSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  company: Joi.string().required().min(2).max(100),
  type: Joi.string().valid('ADMIN', 'SPEAKER', 'GUEST', 'SPONSOR').default('GUEST'),
  phone: Joi.string().optional(),
  position: Joi.string().optional()
});

// Registrar novo participante
router.post('/register', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = participantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message 
      });
    }

    // Verificar se já existe participante com este email
    const existingParticipant = await dynamodb.query({
      TableName: process.env.PARTICIPANTS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': value.email
      }
    }).promise();

    if (existingParticipant.Items.length > 0) {
      return res.status(409).json({ 
        error: 'Participante já cadastrado com este email' 
      });
    }

    // Verificar se foi enviada uma foto
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Foto é obrigatória para o cadastro' 
      });
    }

    const participantId = uuidv4();
    
    // Processar reconhecimento facial
    const faceData = await faceRecognitionService.indexFace(
      req.file.buffer, 
      participantId
    );

    // Salvar participante no DynamoDB
    const participant = {
      id: participantId,
      ...value,
      faceId: faceData.faceId,
      imageKey: faceData.imageKey,
      confidence: faceData.confidence,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE'
    };

    await dynamodb.put({
      TableName: process.env.PARTICIPANTS_TABLE,
      Item: participant
    }).promise();

    // Remover dados sensíveis da resposta
    const { faceId, imageKey, ...safeParticipant } = participant;

    res.status(201).json({
      message: 'Participante cadastrado com sucesso!',
      participant: safeParticipant
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Buscar participante por ID
router.get('/:id', async (req, res) => {
  try {
    const result = await dynamodb.get({
      TableName: process.env.PARTICIPANTS_TABLE,
      Key: { id: req.params.id }
    }).promise();

    if (!result.Item) {
      return res.status(404).json({ error: 'Participante não encontrado' });
    }

    const { faceId, imageKey, ...safeParticipant } = result.Item;
    res.json({ participant: safeParticipant });

  } catch (error) {
    console.error('Get participant error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
