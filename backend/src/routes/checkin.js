const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { dynamodb } = require('../config/aws');
const faceRecognitionService = require('../services/faceRecognition');
const llmService = require('../services/llmService');
const twilioNotificationService = require('../services/twilioNotificationService');

const router = express.Router();

// Realizar checkin por reconhecimento facial
router.post('/face', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Imagem é obrigatória para o checkin' 
      });
    }

    // Buscar face no Rekognition
    const faceMatch = await faceRecognitionService.searchFace(req.file.buffer);
    
    if (!faceMatch) {
      return res.status(404).json({ 
        error: 'Participante não encontrado',
        message: 'Não foi possível identificar sua face. Verifique se você está cadastrado.'
      });
    }

    // Buscar dados do participante
    const participantResult = await dynamodb.get({
      TableName: process.env.PARTICIPANTS_TABLE,
      Key: { id: faceMatch.participantId }
    }).promise();

    if (!participantResult.Item) {
      return res.status(404).json({ 
        error: 'Dados do participante não encontrados' 
      });
    }

    const participant = participantResult.Item;

    // Verificar se já fez checkin hoje
    const today = new Date().toISOString().split('T')[0];
    const existingCheckin = await dynamodb.query({
      TableName: process.env.CHECKINS_TABLE,
      IndexName: 'participant-index',
      KeyConditionExpression: 'participantId = :participantId AND begins_with(#timestamp, :today)',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':participantId': participant.id,
        ':today': today
      }
    }).promise();

    const alreadyCheckedIn = existingCheckin.Items.length > 0;

    // Registrar checkin (mesmo se já fez checkin, para logs)
    const checkinId = uuidv4();
    const checkinData = {
      id: checkinId,
      participantId: participant.id,
      timestamp: new Date().toISOString(),
      confidence: faceMatch.confidence,
      method: 'FACIAL_RECOGNITION',
      status: alreadyCheckedIn ? 'DUPLICATE' : 'SUCCESS'
    };

    await dynamodb.put({
      TableName: process.env.CHECKINS_TABLE,
      Item: checkinData
    }).promise();

    // Gerar saudação personalizada com LLM
    const greeting = await llmService.generateGreeting(participant);

    // Enviar notificação WhatsApp via Twilio
    const notification = await twilioNotificationService.sendCheckinNotification(participant, checkinData);

    // Remover dados sensíveis
    const { faceId, imageKey, ...safeParticipant } = participant;

    res.json({
      success: true,
      participant: safeParticipant,
      checkin: {
        id: checkinId,
        timestamp: checkinData.timestamp,
        alreadyCheckedIn
      },
      greeting,
      notification,
      confidence: faceMatch.confidence
    });

  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Checkin manual por email (fallback)
router.post('/manual', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Buscar participante por email
    const result = await dynamodb.query({
      TableName: process.env.PARTICIPANTS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }).promise();

    if (result.Items.length === 0) {
      return res.status(404).json({ 
        error: 'Participante não encontrado com este email' 
      });
    }

    const participant = result.Items[0];

    // Registrar checkin manual
    const checkinId = uuidv4();
    const checkinData = {
      id: checkinId,
      participantId: participant.id,
      timestamp: new Date().toISOString(),
      method: 'MANUAL',
      status: 'SUCCESS'
    };

    await dynamodb.put({
      TableName: process.env.CHECKINS_TABLE,
      Item: checkinData
    }).promise();

    // Gerar saudação
    const greeting = await llmService.generateGreeting(participant);

    // Enviar notificação WhatsApp via Twilio
    const notification = await twilioNotificationService.sendCheckinNotification(participant, checkinData);

    const { faceId, imageKey, ...safeParticipant } = participant;

    res.json({
      success: true,
      participant: safeParticipant,
      checkin: {
        id: checkinId,
        timestamp: checkinData.timestamp,
        method: 'MANUAL'
      },
      greeting,
      notification
    });

  } catch (error) {
    console.error('Manual checkin error:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Assistência via LLM
router.post('/assistance', async (req, res) => {
  try {
    const { query, participantId } = req.body;
    
    if (!query || !participantId) {
      return res.status(400).json({ 
        error: 'Query e participantId são obrigatórios' 
      });
    }

    // Buscar dados do participante
    const participantResult = await dynamodb.get({
      TableName: process.env.PARTICIPANTS_TABLE,
      Key: { id: participantId }
    }).promise();

    if (!participantResult.Item) {
      return res.status(404).json({ 
        error: 'Participante não encontrado' 
      });
    }

    const response = await llmService.generateAssistance(query, participantResult.Item);

    res.json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Assistance error:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router;
