const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

class MCPNotificationService {
  constructor() {
    this.isConnected = false;
    console.log('📱 MCP Notification Service initialized (mock mode)');
  }

  async sendCheckinNotification(participant, checkin) {
    try {
      // Simular tentativa de conexão MCP
      console.log('🔄 Attempting MCP connection...');
      
      // Como mcp-server-notifications não existe, usar fallback
      return await this.sendFallback(participant, checkin);
      
    } catch (error) {
      console.error('Notification error:', error);
      return await this.sendFallback(participant, checkin);
    }
  }

  async sendFallback(participant, checkin) {
    const message = this.buildCheckinMessage(participant, checkin);
    const participantName = participant.name || 'Participante';
    
    console.log(`📝 Mock MCP notification for ${participantName}:`);
    console.log(message);
    
    // Simular diferentes tipos de notificação
    if (participant.phone) {
      console.log(`📱 [MOCK SMS] Would send to: ${participant.phone}`);
      return {
        success: true,
        method: 'MCP_SMS_MOCK',
        phone: participant.phone,
        message: message
      };
    }
    
    console.log(`🔔 [MOCK PUSH] Would send push notification`);
    return {
      success: true,
      method: 'MCP_PUSH_MOCK',
      message: message,
      participant: participantName
    };
  }

  formatPhoneNumber(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('11') && cleanPhone.length === 11) {
      return `+55${cleanPhone}`;
    }
    
    if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
      return `+${cleanPhone}`;
    }
    
    if (cleanPhone.length === 11) {
      return `+55${cleanPhone}`;
    }
    
    return `+55${cleanPhone}`;
  }

  buildCheckinMessage(participant, checkin) {
    const eventName = process.env.EVENT_NAME || 'TDC Event';
    const time = new Date(checkin.timestamp).toLocaleTimeString('pt-BR');
    const participantName = participant.name || 'Participante';
    
    return `🎉 Check-in realizado com sucesso!

Olá ${participantName}!

Seu check-in no ${eventName} foi confirmado às ${time}.

${this.getPersonalizedMessage(participant.type)}

Tenha um ótimo evento! 🚀`;
  }

  getPersonalizedMessage(participantType) {
    const messages = {
      SPEAKER: '🎤 Boa sorte com sua apresentação!',
      SPONSOR: '🤝 Obrigado por patrocinar nosso evento!',
      ADMIN: '👨‍💼 Tenha um ótimo trabalho organizando!',
      GUEST: '🎯 Aproveite todas as palestras e networking!'
    };
    
    return messages[participantType] || messages.GUEST;
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log('🔌 Disconnected from MCP server');
    }
  }
}

module.exports = new MCPNotificationService();
