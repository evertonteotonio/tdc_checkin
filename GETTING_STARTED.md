# 🚀 Guia de Início Rápido

## Pré-requisitos
- Node.js 18+ instalado
- Docker Desktop rodando
- Terminal/CMD aberto

## Instalação e Execução

### 1. Setup Inicial (primeira vez)
```bash
npm run setup
```
Este comando irá:
- Instalar dependências do backend e frontend
- Iniciar LocalStack (AWS local)
- Configurar tabelas DynamoDB
- Configurar S3 e Rekognition

### 2. Iniciar Desenvolvimento
```bash
npm run dev
```
Este comando inicia todos os serviços:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- LocalStack: http://localhost:4566

### 3. Testar o Sistema

#### Cadastro de Participante
1. Acesse http://localhost:5173
2. Clique em "Cadastro"
3. Preencha os dados obrigatórios
4. Tire uma foto clara do seu rosto
5. Clique em "Cadastrar"

#### Check-in Facial
1. Vá para "Check-in"
2. Escolha "Reconhecimento Facial"
3. Posicione seu rosto na câmera
4. Clique em "Fazer Check-in"
5. Receba sua saudação personalizada!

#### Dashboard Admin
1. Acesse "Admin"
2. Veja estatísticas em tempo real
3. Gerencie participantes
4. Monitore check-ins

## Comandos Úteis

```bash
# Parar todos os serviços
Ctrl+C (no terminal onde rodou npm run dev)

# Parar apenas LocalStack
npm run localstack:stop

# Reiniciar LocalStack
npm run localstack:start

# Rodar apenas backend
npm run backend:dev

# Rodar apenas frontend  
npm run frontend:dev
```

## Troubleshooting

### LocalStack não inicia
```bash
docker-compose -f localstack/docker-compose.yml down
docker-compose -f localstack/docker-compose.yml up -d
```

### Erro de permissão
```bash
chmod +x scripts/*.sh
chmod +x localstack/init-scripts/*.sh
```

### Backend não conecta
Verifique se LocalStack está rodando:
```bash
curl http://localhost:4566/_localstack/health
```

## Próximos Passos

1. **Teste com múltiplos usuários** - Cadastre diferentes tipos de participantes
2. **Explore o LLM** - Faça perguntas no check-in sobre agenda, localização, etc.
3. **Dashboard Admin** - Monitore estatísticas em tempo real
4. **Deploy AWS** - Configure para produção com AWS real

## Estrutura de Dados

### Participante
- Nome, email, empresa (obrigatórios)
- Foto para reconhecimento facial
- Tipo: ADMIN, SPEAKER, GUEST, SPONSOR

### Check-in
- Reconhecimento facial automático
- Fallback manual por email
- Assistência via LLM
- Logs completos para auditoria

---

**Divirta-se explorando o sistema!** 🎉
