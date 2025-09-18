const { bedrock } = require('../config/aws');

class LLMService {
  constructor() {
    this.modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';
  }

  async generateGreeting(participant) {
    try {
      const prompt = this.buildGreetingPrompt(participant);
      const response = await this.invokeBedrock(prompt);
      
      return {
        greeting: response.greeting || `Olá ${participant.name}! Bem-vindo ao evento! 🎉`,
        tip: response.tip || "Não esqueça de conferir a agenda no app!",
        participantType: participant.type,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating greeting:', error);
      // Sempre usar fallback em caso de erro (sem falhar o check-in)
      console.log('Using fallback greeting for participant:', participant.name);
      return this.mockGreeting(participant);
    }
  }

  async generateAssistance(query, participant) {
    try {
      const prompt = this.buildAssistancePrompt(query, participant);
      const response = await this.invokeBedrock(prompt);
      
      return response.response || this.mockAssistance(query, participant);
    } catch (error) {
      console.error('Error generating assistance:', error);
      // Sempre usar fallback em caso de erro
      console.log('Using fallback assistance for query:', query);
      return this.mockAssistance(query, participant);
    }
  }

  async invokeBedrock(prompt) {
    try {
      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      };

      const response = await bedrock.invokeModel({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
      }).promise();

      const responseBody = JSON.parse(response.body.toString());
      const content = responseBody.content[0].text;

      // Tentar parsear como JSON, senão retornar texto simples
      try {
        return JSON.parse(content);
      } catch {
        return { response: content, greeting: content };
      }
    } catch (error) {
      console.error('Bedrock invocation error:', error);
      throw error;
    }
  }

  buildGreetingPrompt(participant) {
    return `Você é um assistente de eventos amigável. Crie uma saudação personalizada para o participante.

Dados do participante:
- Nome: ${participant.name}
- Empresa: ${participant.company}
- Tipo: ${participant.type}

Responda em JSON com:
{
  "greeting": "saudação calorosa e personalizada",
  "tip": "dica útil sobre o evento"
}

Seja caloroso, profissional e inclua emojis apropriados.`;
  }

  buildAssistancePrompt(query, participant) {
    return `Você é um assistente de eventos. Responda à pergunta do participante de forma útil e amigável.

Participante: ${participant.name} (${participant.type})
Pergunta: ${query}

Informações do evento:
- WiFi: "EventoTech" / senha: "TechEvent2024"
- Agenda: Keynote 9h, Tech Talks 14h, Networking 17h
- Localização: 3 andares - Térreo (recepção), 1º andar (workshops), 2º andar (auditório principal)

Responda em JSON:
{
  "response": "resposta útil e amigável"
}`;
  }

  // Fallback methods
  mockGreeting(participant) {
    const greetings = [
      `Olá ${participant.name}! Bem-vindo ao evento! 🎉`,
      `Oi ${participant.name}! Que bom te ver aqui! ✨`,
      `Bem-vindo ${participant.name}! O evento está incrível hoje! 🚀`,
      `Olá ${participant.name}! Esperamos que aproveite muito o evento! 🎯`
    ];

    const tips = [
      "Não esqueça de conferir a agenda no app!",
      "O coffee break será às 15h no hall principal.",
      "Há uma área de networking no 2º andar.",
      "As palestras principais são no auditório central."
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const tip = tips[Math.floor(Math.random() * tips.length)];

    return {
      greeting,
      tip,
      participantType: participant.type,
      timestamp: new Date().toISOString()
    };
  }

  mockAssistance(query, participant) {
    const responses = {
      'agenda': `Olá ${participant.name}! A agenda completa está disponível no app. As principais palestras são: Keynote às 9h, Tech Talks às 14h, e Networking às 17h.`,
      'localização': `O evento acontece em 3 andares: Térreo (recepção e coffee), 1º andar (salas de workshop), 2º andar (auditório principal e networking).`,
      'wifi': `A rede WiFi é "EventoTech" e a senha é "TechEvent2024". Há também pontos de carregamento em todos os andares.`,
      'default': `Olá ${participant.name}! Como posso ajudá-lo hoje? Posso fornecer informações sobre agenda, localização, WiFi ou outras dúvidas sobre o evento.`
    };

    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('agenda') || lowerQuery.includes('programação')) {
      return responses.agenda;
    } else if (lowerQuery.includes('onde') || lowerQuery.includes('localização') || lowerQuery.includes('local')) {
      return responses.localização;
    } else if (lowerQuery.includes('wifi') || lowerQuery.includes('internet')) {
      return responses.wifi;
    }
    
    return responses.default;
  }
}

module.exports = new LLMService();
