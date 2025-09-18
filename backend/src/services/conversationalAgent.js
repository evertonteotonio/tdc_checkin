const { bedrock } = require('../config/aws');

class ConversationalAgent {
  constructor() {
    this.sessions = new Map(); // Armazenar sessões de conversa
  }

  async startRegistrationChat(sessionId) {
    const initialPrompt = {
      role: 'system',
      content: `Você é um assistente de cadastro para eventos. Sua função é coletar dados dos participantes de forma conversacional e amigável.

DADOS NECESSÁRIOS:
- Nome completo
- Email
- Empresa
- Tipo de participante (GUEST, SPEAKER, SPONSOR, ADMIN)
- Telefone (opcional)
- Cargo (opcional)
- Foto (obrigatória)

REGRAS:
1. Seja amigável e conversacional
2. Faça UMA pergunta por vez
3. Valide os dados conforme coleta
4. Quando precisar da foto, responda EXATAMENTE: "CAMERA_REQUEST"
5. Após coletar todos os dados, responda: "REGISTRATION_COMPLETE" seguido dos dados em JSON

Inicie cumprimentando e perguntando o nome.`
    };

    this.sessions.set(sessionId, {
      messages: [initialPrompt],
      collectedData: {},
      step: 'greeting'
    });

    return await this.processMessage(sessionId, "Olá! Gostaria de me cadastrar no evento.");
  }

  async processMessage(sessionId, userMessage) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    // Adicionar mensagem do usuário
    session.messages.push({
      role: 'user',
      content: userMessage
    });

    try {
      const response = await this.callBedrock(session.messages);
      
      // Adicionar resposta do assistente
      session.messages.push({
        role: 'assistant',
        content: response
      });

      // Verificar comandos especiais
      if (response.includes('CAMERA_REQUEST')) {
        return {
          type: 'camera_request',
          message: response.replace('CAMERA_REQUEST', '').trim() || 'Agora preciso de uma foto sua para o cadastro. Vou abrir a câmera.',
          needsCamera: true
        };
      }

      if (response.includes('REGISTRATION_COMPLETE')) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const registrationData = JSON.parse(jsonMatch[0]);
            this.sessions.delete(sessionId); // Limpar sessão
            return {
              type: 'registration_complete',
              message: response.replace(/REGISTRATION_COMPLETE[\s\S]*/, '').trim(),
              data: registrationData
            };
          } catch (e) {
            console.error('Erro ao parsear dados de registro:', e);
          }
        }
      }

      return {
        type: 'message',
        message: response,
        needsCamera: false
      };

    } catch (error) {
      console.error('Erro no agente conversacional:', error);
      return {
        type: 'error',
        message: 'Desculpe, tive um problema. Pode repetir sua última informação?'
      };
    }
  }

  async processPhotoCapture(sessionId, photoData) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    // Informar que a foto foi capturada
    const photoMessage = "Foto capturada com sucesso! Agora vou finalizar seu cadastro.";
    
    session.messages.push({
      role: 'user',
      content: "Foto capturada"
    });

    session.messages.push({
      role: 'assistant',
      content: photoMessage
    });

    // Solicitar finalização do cadastro
    session.messages.push({
      role: 'user',
      content: "Por favor, finalize meu cadastro com todos os dados coletados."
    });

    const response = await this.callBedrock(session.messages);
    
    session.messages.push({
      role: 'assistant',
      content: response
    });

    // Verificar se tem dados completos
    if (response.includes('REGISTRATION_COMPLETE')) {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const registrationData = JSON.parse(jsonMatch[0]);
          registrationData.photo = photoData; // Adicionar foto aos dados
          this.sessions.delete(sessionId); // Limpar sessão
          return {
            type: 'registration_complete',
            message: response.replace(/REGISTRATION_COMPLETE[\s\S]*/, '').trim(),
            data: registrationData
          };
        } catch (e) {
          console.error('Erro ao parsear dados de registro:', e);
        }
      }
    }

    return {
      type: 'message',
      message: response
    };
  }

  async callBedrock(messages) {
    // Separar mensagem system das outras
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system').slice(-10); // Últimas 10 mensagens
    
    // Garantir que a primeira mensagem seja do usuário
    if (conversationMessages.length === 0 || conversationMessages[0].role !== 'user') {
      conversationMessages.unshift({
        role: 'user',
        content: 'Olá, gostaria de me cadastrar no evento.'
      });
    }

    const params = {
      modelId: process.env.BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 300,
        messages: conversationMessages,
        system: systemMessage?.content || 'Você é um assistente de cadastro para eventos.'
      })
    };

    const response = await bedrock.invokeModel(params).promise();
    const responseBody = JSON.parse(response.body.toString());
    
    return responseBody.content[0].text;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }
}

module.exports = new ConversationalAgent();
