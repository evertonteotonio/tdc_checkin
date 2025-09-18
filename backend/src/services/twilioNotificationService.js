const axios = require('axios');

class TwilioNotificationService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    console.log('📱 Twilio Notification Service initialized');
  }

  async sendCheckinNotification(participant, checkin) {
    if (!this.accountSid || !this.authToken) {
      console.log('⚠️ Twilio credentials not configured, using mock');
      return this.mockNotification(participant, checkin);
    }

    return await this.sendWhatsAppMessage(participant, checkin);
  }

  async sendWhatsAppMessage(participant, checkin) {
    try {
      const phoneNumber = this.formatWhatsAppNumber(participant.phone);
      const message = this.buildWelcomeMessage(participant, checkin);

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        new URLSearchParams({
          'To': phoneNumber,
          'From': this.whatsappFrom,
          'Body': message
        }),
        {
          auth: {
            username: this.accountSid,
            password: this.authToken
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log(`📱 WhatsApp sent to ${phoneNumber}: ${response.data.sid}`);
      
      return {
        success: true,
        method: 'TWILIO_WHATSAPP',
        messageSid: response.data.sid,
        to: phoneNumber,
        status: response.data.status,
        participant: participant.name || 'Participante'
      };

    } catch (error) {
      console.error('Twilio WhatsApp error:', error.response?.data || error.message);
      return this.mockNotification(participant, checkin);
    }
  }

  mockNotification(participant, checkin) {
    const phoneNumber = this.formatWhatsAppNumber(participant.phone);
    const message = this.buildWelcomeMessage(participant, checkin);

    console.log(`📱 [MOCK WhatsApp] Would send to ${phoneNumber}:`);
    console.log(message);

    return {
      success: true,
      method: 'WHATSAPP_MOCK',
      to: phoneNumber,
      message: message,
      participant: participant.name || 'Participante'
    };
  }

  buildWelcomeMessage(participant, checkin) {
    const eventName = process.env.EVENT_NAME || 'TDC Event';
    const participantName = participant.name || 'Participante';
    const time = new Date(checkin.timestamp).toLocaleTimeString('pt-BR');
    const date = new Date(checkin.timestamp).toLocaleDateString('pt-BR');

    return `🎉 *Bem-vindo ao ${eventName}!*

Olá *${participantName}*! 👋

✅ Seu check-in foi confirmado com sucesso!
📅 Data: ${date}
⏰ Horário: ${time}

${this.getPersonalizedMessage(participant.type)}

Tenha um evento incrível! 🚀

_Mensagem automática do sistema de check-in_`;
  }

  getPersonalizedMessage(participantType) {
    const messages = {
      SPEAKER: '🎤 *Palestrante confirmado!* Boa sorte com sua apresentação!',
      SPONSOR: '🤝 *Patrocinador VIP!* Obrigado por apoiar nosso evento!',
      ADMIN: '👨‍💼 *Organizador ativo!* Tenha um ótimo trabalho!',
      GUEST: '🎯 *Participante registrado!* Aproveite todas as palestras!'
    };
    
    return messages[participantType] || messages.GUEST;
  }

  formatWhatsAppNumber(phone) {
    if (!phone) return null;
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (phone.startsWith('whatsapp:')) {
      return phone;
    }
    
    if (cleanPhone.startsWith('11') && cleanPhone.length === 11) {
      return `whatsapp:+55${cleanPhone}`;
    }
    
    if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
      return `whatsapp:+${cleanPhone}`;
    }
    
    if (cleanPhone.length === 11) {
      return `whatsapp:+55${cleanPhone}`;
    }
    
    return `whatsapp:+55${cleanPhone}`;
  }
}

module.exports = new TwilioNotificationService();
