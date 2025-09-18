const twilioWhatsAppService = require('./twilioWhatsAppService');

class MCPNotificationService {
  constructor() {
    console.log('📱 Notification Service initialized (mock mode)');
  }

  async sendCheckinNotification(participant, checkin) {
    const smsResult = await this.sendSMSNotification(participant, checkin);
    const whatsappResult = await this.sendWhatsAppNotification(participant, checkin);
    
    return {
      sms: smsResult,
      whatsapp: whatsappResult
    };
  }

  async sendSMSNotification(participant, checkin) {
    const message = this.buildCheckinMessage(participant, checkin);
    const participantName = participant.name || 'Participante';
    
    console.log(`📝 Mock SMS for ${participantName}:`);
    console.log(message);
    
    if (participant.phone) {
      console.log(`📱 [MOCK SMS] Would send to: ${participant.phone}`);
      return {
        success: true,
        method: 'SMS_MOCK',
        phone: participant.phone,
        message: message,
        participant: participantName
      };
    }
    
    return {
      success: true,
      method: 'SMS_MOCK',
      message: message,
      participant: participantName
    };
  }

  async sendWhatsAppNotification(participant, checkin) {
    if (!participant.phone) {
      return {
        success: false,
        method: 'WHATSAPP_SKIP',
        reason: 'No phone number'
      };
    }

    return await twilioWhatsAppService.sendWelcomeMessage(participant, checkin);
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
}

module.exports = new MCPNotificationService();
