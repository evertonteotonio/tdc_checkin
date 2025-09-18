const twilio = require('twilio');

class NotificationService {
  constructor() {
    // Configuração do Twilio para SMS
    this.twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
      ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : null;
    
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async sendCheckinNotification(participant, checkin) {
    try {
      const message = this.buildCheckinMessage(participant, checkin);
      
      // Tentar enviar via SMS se Twilio estiver configurado
      if (this.twilioClient && participant.phone) {
        await this.sendSMS(participant.phone, message);
        console.log(`SMS notification sent to ${participant.phone}`);
        return { success: true, method: 'SMS', phone: participant.phone };
      }
      
      // Fallback para log/mock notification
      console.log(`Mock notification for ${participant.name}: ${message}`);
      return { success: true, method: 'MOCK', message };
      
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendSMS(phoneNumber, message) {
    if (!this.twilioClient) {
      throw new Error('Twilio not configured');
    }

    // Formatar número para padrão internacional
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    const result = await this.twilioClient.messages.create({
      body: message,
      from: this.twilioPhoneNumber,
      to: formattedPhone
    });

    return result;
  }

  formatPhoneNumber(phone) {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Se começar com 11 (Brasil), adicionar +55
    if (cleanPhone.startsWith('11') && cleanPhone.length === 11) {
      return `+55${cleanPhone}`;
    }
    
    // Se já tiver código do país, manter
    if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
      return `+${cleanPhone}`;
    }
    
    // Assumir Brasil se não tiver código
    if (cleanPhone.length === 11) {
      return `+55${cleanPhone}`;
    }
    
    return `+55${cleanPhone}`;
  }

  buildCheckinMessage(participant, checkin) {
    const eventName = process.env.EVENT_NAME || 'TDC Event';
    const time = new Date(checkin.timestamp).toLocaleTimeString('pt-BR');
    
    return `🎉 Check-in realizado com sucesso!

Olá ${participant.name}!

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

module.exports = new NotificationService();
