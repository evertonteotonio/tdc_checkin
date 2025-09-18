const axios = require('axios');

class TwilioWhatsAppService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    this.contentSid = process.env.TWILIO_CONTENT_SID || 'HXb5b62575e6e4ff6129ad7c8efe1f983e';
  }

  async sendWelcomeMessage(participant, checkin) {
    if (!this.accountSid || !this.authToken) {
      console.log('📱 [MOCK WhatsApp] Twilio credentials not configured');
      return this.mockWhatsAppMessage(participant, checkin);
    }

    try {
      const phoneNumber = this.formatWhatsAppNumber(participant.phone);
      const eventDate = new Date(checkin.timestamp).toLocaleDateString('pt-BR');
      const eventTime = new Date(checkin.timestamp).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        new URLSearchParams({
          'To': phoneNumber,
          'From': this.fromNumber,
          'ContentSid': this.contentSid,
          'ContentVariables': JSON.stringify({
            "1": eventDate,
            "2": eventTime
          })
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
        status: response.data.status
      };

    } catch (error) {
      console.error('Twilio WhatsApp error:', error.response?.data || error.message);
      return this.mockWhatsAppMessage(participant, checkin);
    }
  }

  mockWhatsAppMessage(participant, checkin) {
    const phoneNumber = this.formatWhatsAppNumber(participant.phone);
    const eventDate = new Date(checkin.timestamp).toLocaleDateString('pt-BR');
    const eventTime = new Date(checkin.timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    console.log(`📱 [MOCK WhatsApp] Would send to ${phoneNumber}:`);
    console.log(`🎉 Bem-vindo ao TDC Event!`);
    console.log(`📅 Data: ${eventDate}`);
    console.log(`⏰ Horário: ${eventTime}`);
    console.log(`📱 QR Code seria enviado via template`);

    return {
      success: true,
      method: 'WHATSAPP_MOCK',
      to: phoneNumber,
      eventDate,
      eventTime,
      participant: participant.name || 'Participante'
    };
  }

  formatWhatsAppNumber(phone) {
    if (!phone) return null;
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Se já tem whatsapp: prefix, retorna como está
    if (phone.startsWith('whatsapp:')) {
      return phone;
    }
    
    // Formatar número brasileiro
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

module.exports = new TwilioWhatsAppService();
