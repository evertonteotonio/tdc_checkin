#!/bin/bash

echo "🔧 Configurando recursos AWS com perfil tdc..."

# Usar perfil tdc
export AWS_PROFILE=tdc
REGION=us-east-1

# Verificar se perfil tdc está configurado
if ! aws sts get-caller-identity --profile tdc > /dev/null 2>&1; then
    echo "❌ Perfil AWS 'tdc' não encontrado ou inválido"
    echo "Configure com: aws configure --profile tdc"
    exit 1
fi

echo "✅ Perfil AWS 'tdc' configurado"

# Criar tabelas DynamoDB
echo "📊 Criando tabelas DynamoDB..."

# Tabela de participantes
aws dynamodb create-table \
    --profile tdc \
    --region $REGION \
    --table-name event-participants \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=email,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=email-index,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST \
    --billing-mode PAY_PER_REQUEST \
    --no-cli-pager 2>/dev/null || echo "Tabela event-participants já existe"

# Tabela de checkins
aws dynamodb create-table \
    --profile tdc \
    --region $REGION \
    --table-name event-checkins \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=participantId,AttributeType=S \
        AttributeName=timestamp,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=participant-index,KeySchema=[{AttributeName=participantId,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST \
    --billing-mode PAY_PER_REQUEST \
    --no-cli-pager 2>/dev/null || echo "Tabela event-checkins já existe"

echo "✅ Tabelas DynamoDB configuradas"

# Criar bucket S3
BUCKET_NAME=event-checkin-photos-tdc
echo "📦 Criando bucket S3: $BUCKET_NAME"

aws s3 mb "s3://$BUCKET_NAME" --profile tdc --region $REGION 2>/dev/null || echo "Bucket já existe"

# Configurar CORS do S3
aws s3api put-bucket-cors \
    --profile tdc \
    --bucket $BUCKET_NAME \
    --cors-configuration '{
      "CORSRules": [
        {
          "AllowedHeaders": ["*"],
          "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
          "AllowedOrigins": ["*"],
          "ExposeHeaders": ["ETag"]
        }
      ]
    }' 2>/dev/null

echo "✅ Bucket S3 configurado"

# Criar collection Rekognition
COLLECTION_ID=event-faces-tdc
echo "👁️  Criando collection Rekognition: $COLLECTION_ID"

aws rekognition create-collection \
    --profile tdc \
    --region $REGION \
    --collection-id $COLLECTION_ID \
    --no-cli-pager 2>/dev/null || echo "Collection já existe"

echo "✅ Collection Rekognition configurada"

# Verificar acesso ao Bedrock
echo "🤖 Verificando acesso ao Bedrock..."
if aws bedrock list-foundation-models --profile tdc --region $REGION --no-cli-pager > /dev/null 2>&1; then
    echo "✅ Bedrock acessível"
else
    echo "⚠️  Bedrock pode não estar disponível"
    echo "   Solicite acesso aos modelos no console AWS Bedrock"
fi

echo ""
echo "✅ Setup AWS concluído!"
echo "📝 Recursos criados:"
echo "   - DynamoDB: event-participants, event-checkins"
echo "   - S3 Bucket: $BUCKET_NAME"
echo "   - Rekognition Collection: $COLLECTION_ID"
echo "   - Região: $REGION"
echo "   - Perfil: tdc"
