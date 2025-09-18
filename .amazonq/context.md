# Event Checkin System - Context

## Visão Geral
Sistema de check-in inteligente para eventos com reconhecimento facial e assistência por IA desenvolvido para o Desafio TDC.

## Arquitetura
- **Frontend**: React + Vite + TailwindCSS (porta 5173)
- **Backend**: Node.js + Express + AWS SDK (porta 3001)
- **Database**: DynamoDB
- **Storage**: S3 para fotos
- **AI Services**: AWS Rekognition (reconhecimento facial) + Bedrock (LLM)

## Funcionalidades Principais
1. **Cadastro de Participantes**: Upload de foto e dados pessoais
2. **Check-in Facial**: Reconhecimento automático via câmera
3. **Assistência IA**: Chat com LLM para suporte aos participantes
4. **Dashboard Admin**: Gestão de participantes e relatórios

## Tipos de Usuário
- **ADMIN**: Acesso completo ao dashboard
- **SPEAKER**: Cadastro + check-in + agenda
- **GUEST**: Cadastro + check-in básico
- **SPONSOR**: Cadastro + check-in + networking

## Estrutura de Dados
```javascript
// Participante
{
  id: string,
  name: string,
  email: string,
  userType: 'ADMIN' | 'SPEAKER' | 'GUEST' | 'SPONSOR',
  faceId: string, // ID do Rekognition
  imageKey: string, // Chave S3
  checkedIn: boolean,
  checkinTime: timestamp
}
```

## Comandos Importantes
- `npm run setup`: Configuração inicial
- `npm run dev`: Iniciar desenvolvimento
- `npm test`: Executar testes

## Configuração AWS
- Profile: `tdc`
- Region: `us-east-1`
- LocalStack para desenvolvimento local

## Segurança
- Dados sensíveis (faceId, imageKey) não expostos na API
- Validação com Joi
- CORS configurado
