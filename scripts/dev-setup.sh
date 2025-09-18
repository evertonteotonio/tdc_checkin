#!/bin/bash

echo "🚀 Configurando ambiente de desenvolvimento..."

# Verificar se perfil AWS tdc está configurado
if ! aws sts get-caller-identity --profile tdc > /dev/null 2>&1; then
    echo "❌ Perfil AWS 'tdc' não encontrado"
    echo "Configure com: aws configure --profile tdc"
    exit 1
fi

echo "✅ Perfil AWS 'tdc' encontrado"

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend && npm install
cd ..

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd frontend && npm install
cd ..

# Configurar recursos AWS
echo "🔧 Configurando recursos AWS..."
./scripts/setup-aws.sh

echo "✅ Setup concluído!"
echo ""
echo "📝 Serviços configurados:"
echo "  - DynamoDB: Tabelas criadas"
echo "  - S3: Bucket para fotos"
echo "  - Rekognition: Collection criada"
echo "  - Bedrock: Verificado"
echo "  - Perfil AWS: tdc"
echo "  - Região: us-east-1"
echo ""
echo "Para iniciar o desenvolvimento:"
echo "  npm run dev"
