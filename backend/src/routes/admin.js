const express = require('express');
const { dynamodb } = require('../config/aws');

const router = express.Router();

// Listar todos os participantes
router.get('/participants', async (req, res) => {
  try {
    const result = await dynamodb.scan({
      TableName: process.env.PARTICIPANTS_TABLE
    }).promise();

    const participants = result.Items.map(item => {
      const { faceId, imageKey, ...safeItem } = item;
      return safeItem;
    });

    res.json({
      participants,
      total: participants.length
    });

  } catch (error) {
    console.error('List participants error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas do evento
router.get('/stats', async (req, res) => {
  try {
    // Contar participantes
    const participantsResult = await dynamodb.scan({
      TableName: process.env.PARTICIPANTS_TABLE,
      Select: 'COUNT'
    }).promise();

    // Contar checkins
    const checkinsResult = await dynamodb.scan({
      TableName: process.env.CHECKINS_TABLE,
      Select: 'COUNT'
    }).promise();

    // Checkins por tipo
    const checkinsByType = await dynamodb.scan({
      TableName: process.env.CHECKINS_TABLE
    }).promise();

    const stats = {
      totalParticipants: participantsResult.Count,
      totalCheckins: checkinsResult.Count,
      checkinsByMethod: {
        facial: checkinsByType.Items.filter(item => item.method === 'FACIAL_RECOGNITION').length,
        manual: checkinsByType.Items.filter(item => item.method === 'MANUAL').length
      },
      checkinRate: participantsResult.Count > 0 
        ? ((checkinsResult.Count / participantsResult.Count) * 100).toFixed(2)
        : 0
    };

    res.json(stats);

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar checkins recentes
router.get('/checkins', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await dynamodb.scan({
      TableName: process.env.CHECKINS_TABLE,
      Limit: limit
    }).promise();

    // Buscar dados dos participantes para cada checkin
    const checkinsWithParticipants = await Promise.all(
      result.Items.map(async (checkin) => {
        const participantResult = await dynamodb.get({
          TableName: process.env.PARTICIPANTS_TABLE,
          Key: { id: checkin.participantId }
        }).promise();

        return {
          ...checkin,
          participant: participantResult.Item ? {
            name: participantResult.Item.name,
            email: participantResult.Item.email,
            company: participantResult.Item.company,
            type: participantResult.Item.type
          } : null
        };
      })
    );

    // Ordenar por timestamp (mais recentes primeiro)
    checkinsWithParticipants.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json({
      checkins: checkinsWithParticipants,
      total: checkinsWithParticipants.length
    });

  } catch (error) {
    console.error('List checkins error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar participante específico
router.get('/participants/:id', async (req, res) => {
  try {
    const participantResult = await dynamodb.get({
      TableName: process.env.PARTICIPANTS_TABLE,
      Key: { id: req.params.id }
    }).promise();

    if (!participantResult.Item) {
      return res.status(404).json({ error: 'Participante não encontrado' });
    }

    // Buscar checkins do participante
    const checkinsResult = await dynamodb.query({
      TableName: process.env.CHECKINS_TABLE,
      IndexName: 'participant-index',
      KeyConditionExpression: 'participantId = :participantId',
      ExpressionAttributeValues: {
        ':participantId': req.params.id
      }
    }).promise();

    const { faceId, imageKey, ...safeParticipant } = participantResult.Item;

    res.json({
      participant: safeParticipant,
      checkins: checkinsResult.Items.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )
    });

  } catch (error) {
    console.error('Get participant details error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
