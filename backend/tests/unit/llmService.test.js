const llmService = require('../../src/services/llmService');

describe('LLMService', () => {
  describe('generateGreeting', () => {
    it('should generate greeting for GUEST participant', async () => {
      const participant = {
        name: 'João Silva',
        type: 'GUEST',
        company: 'Tech Corp'
      };

      const result = await llmService.generateGreeting(participant);

      expect(result).toHaveProperty('greeting');
      expect(result).toHaveProperty('tip');
      expect(result).toHaveProperty('participantType', 'GUEST');
      expect(result).toHaveProperty('timestamp');
      expect(result.greeting).toContain('João');
    });

    it('should generate greeting for SPEAKER participant', async () => {
      const participant = {
        name: 'Maria Santos',
        type: 'SPEAKER',
        company: 'Dev Company'
      };

      const result = await llmService.generateGreeting(participant);

      expect(result.participantType).toBe('SPEAKER');
      expect(result.greeting).toContain('Maria');
    });
  });

  describe('generateAssistance', () => {
    it('should generate assistance response', async () => {
      const query = 'Onde fica o banheiro?';
      const participant = { name: 'João', type: 'GUEST' };

      const result = await llmService.generateAssistance(query, participant);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('mockGreeting', () => {
    it('should generate appropriate mock greeting for each participant type', () => {
      const types = ['GUEST', 'SPEAKER', 'SPONSOR', 'ADMIN'];
      
      types.forEach(type => {
        const participant = { name: 'Test User', type, company: 'Test Corp' };
        const result = llmService.mockGreeting(participant);
        
        expect(result).toHaveProperty('greeting');
        expect(result).toHaveProperty('tip');
        expect(result.greeting).toContain('Test User');
      });
    });
  });
});
