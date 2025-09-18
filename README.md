# Event Checkin System

Sistema de check-in inteligente para eventos com reconhecimento facial e assistência por IA.

## 🚀 Tecnologias

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + AWS SDK
- **AI Services**: AWS Rekognition + Bedrock
- **Database**: DynamoDB
- **Storage**: S3

## 📋 Pré-requisitos

- Node.js 18+
- **AWS CLI configurado** com perfil "tdc"
- **Acesso ao AWS Rekognition e Bedrock**

## 🛠️ Setup Inicial

```bash
# Configurar perfil AWS (se ainda não fez)
aws configure --profile tdc

# Instalar dependências e configurar AWS
npm run setup

# Iniciar ambiente de desenvolvimento
npm run dev
```

## 🌐 URLs de Desenvolvimento

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **AWS Profile**: tdc (us-east-1)

## 📁 Estrutura do Projeto

```
event-checkin/
├── frontend/           # React app
├── backend/           # Node.js API
├── scripts/           # Scripts de desenvolvimento
└── README.md
```

## 🔧 Comandos Disponíveis

```bash
npm run dev              # Iniciar desenvolvimento completo
npm run setup           # Setup inicial do projeto
npm run setup-aws      # Configurar apenas recursos AWS
npm run backend:dev     # Iniciar apenas backend
npm run frontend:dev    # Iniciar apenas frontend
```

## 🎯 Funcionalidades

### ✅ Implementado
- [x] Cadastro de participantes com foto
- [x] Reconhecimento facial para check-in
- [x] Assistência via LLM (mock)
- [x] Dashboard administrativo
- [x] Interface responsiva
- [x] LocalStack para desenvolvimento

### 🚧 Próximos Passos
- [ ] Integração real com AWS Bedrock
- [ ] Autenticação de administradores
- [ ] Relatórios avançados
- [ ] Notificações em tempo real
- [ ] Deploy para AWS

## 🏗️ Arquitetura

```
Frontend (React) → API Gateway → Lambda Functions
                      ↓
    AWS Rekognition + Bedrock + DynamoDB
```

## 🔒 Segurança

- Dados sensíveis (faceId, imageKey) não são expostos na API
- Validação de entrada com Joi
- CORS configurado
- Rate limiting (produção)

## 📊 Tipos de Usuário

- **ADMIN**: Acesso completo ao dashboard
- **SPEAKER**: Cadastro + check-in + agenda
- **GUEST**: Cadastro + check-in básico
- **SPONSOR**: Cadastro + check-in + networking

## 🐛 Troubleshooting

### Erro de credenciais AWS
```bash
aws configure --profile tdc
# Insira suas credenciais AWS
```

### Erro de permissão nos scripts
```bash
chmod +x scripts/*.sh
```

### Erro de acesso ao Bedrock
Solicite acesso aos modelos no console AWS Bedrock:
1. Acesse AWS Console > Bedrock
2. Model access > Request model access
3. Selecione Claude 3 Sonnet

## 📝 Logs

- Backend: Console do terminal
- Frontend: DevTools do navegador
- AWS: CloudWatch Logs

## 🚀 Deploy para Produção

1. Configurar AWS CLI
2. Alterar endpoints para AWS real
3. Configurar variáveis de ambiente
4. Deploy com Terraform/CDK

---

**Desenvolvido para o Desafio TDC** 🎯
