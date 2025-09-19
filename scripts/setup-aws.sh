#!/bin/bash

echo "🔧 Configurando infraestrutura AWS completa para Event Checkin System..."

# Configurações
export AWS_PROFILE=tdc
REGION=us-east-1
BUCKET_NAME=event-checkin-photos-tdc
COLLECTION_ID=event-faces-tdc

# Verificar se perfil tdc está configurado
if ! aws sts get-caller-identity --profile tdc > /dev/null 2>&1; then
    echo "❌ Perfil AWS 'tdc' não encontrado ou inválido"
    echo "Configure com: aws configure --profile tdc"
    exit 1
fi

echo "✅ Perfil AWS 'tdc' configurado"

# Função para aguardar recurso ficar ativo
wait_for_table() {
    local table_name=$1
    echo "⏳ Aguardando tabela $table_name ficar ativa..."
    aws dynamodb wait table-exists --profile tdc --region $REGION --table-name $table_name
    echo "✅ Tabela $table_name ativa"
}

# Criar tabelas DynamoDB
echo "📊 Criando tabelas DynamoDB..."

# Tabela de participantes
echo "Criando tabela event-participants..."
if aws dynamodb describe-table --profile tdc --region $REGION --table-name event-participants --no-cli-pager >/dev/null 2>&1; then
    echo "Tabela event-participants já existe"
else
    aws dynamodb create-table \
        --profile tdc \
        --region $REGION \
        --table-name event-participants \
        --attribute-definitions '[
            {"AttributeName":"id","AttributeType":"S"},
            {"AttributeName":"email","AttributeType":"S"}
        ]' \
        --key-schema '[
            {"AttributeName":"id","KeyType":"HASH"}
        ]' \
        --global-secondary-indexes '[
            {
                "IndexName":"email-index",
                "KeySchema":[{"AttributeName":"email","KeyType":"HASH"}],
                "Projection":{"ProjectionType":"ALL"},
                "ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}
            }
        ]' \
        --provisioned-throughput '{"ReadCapacityUnits":5,"WriteCapacityUnits":5}' \
        --tags '[
            {"Key":"Environment","Value":"development"},
            {"Key":"Project","Value":"tdc-checkin"}
        ]' \
        --no-cli-pager
    
    if [ $? -eq 0 ]; then
        wait_for_table event-participants
    else
        echo "❌ Erro ao criar tabela event-participants"
        exit 1
    fi
fi

# Tabela de checkins
echo "Criando tabela event-checkins..."
if aws dynamodb describe-table --profile tdc --region $REGION --table-name event-checkins --no-cli-pager >/dev/null 2>&1; then
    echo "Tabela event-checkins já existe"
else
    aws dynamodb create-table \
        --profile tdc \
        --region $REGION \
        --table-name event-checkins \
        --attribute-definitions '[
            {"AttributeName":"id","AttributeType":"S"},
            {"AttributeName":"participantId","AttributeType":"S"},
            {"AttributeName":"timestamp","AttributeType":"S"}
        ]' \
        --key-schema '[
            {"AttributeName":"id","KeyType":"HASH"}
        ]' \
        --global-secondary-indexes '[
            {
                "IndexName":"participant-index",
                "KeySchema":[
                    {"AttributeName":"participantId","KeyType":"HASH"},
                    {"AttributeName":"timestamp","KeyType":"RANGE"}
                ],
                "Projection":{"ProjectionType":"ALL"},
                "ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}
            }
        ]' \
        --provisioned-throughput '{"ReadCapacityUnits":5,"WriteCapacityUnits":5}' \
        --tags '[
            {"Key":"Environment","Value":"development"},
            {"Key":"Project","Value":"tdc-checkin"}
        ]' \
        --no-cli-pager
    
    if [ $? -eq 0 ]; then
        wait_for_table event-checkins
    else
        echo "❌ Erro ao criar tabela event-checkins"
        exit 1
    fi
fi

echo "✅ Tabelas DynamoDB configuradas"

# Criar bucket S3
echo "📦 Criando bucket S3: $BUCKET_NAME"
aws s3 mb "s3://$BUCKET_NAME" --profile tdc --region $REGION 2>/dev/null || echo "Bucket já existe"

# Configurar CORS do S3
echo "Configurando CORS do S3..."
aws s3api put-bucket-cors \
    --profile tdc \
    --bucket $BUCKET_NAME \
    --cors-configuration '{
      "CORSRules": [
        {
          "AllowedHeaders": ["*"],
          "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
          "AllowedOrigins": ["http://localhost:5173", "http://localhost:3001", "*"],
          "ExposeHeaders": ["ETag", "x-amz-request-id"],
          "MaxAgeSeconds": 3000
        }
      ]
    }' 2>/dev/null

# Configurar versionamento do S3
echo "Configurando versionamento do S3..."
aws s3api put-bucket-versioning \
    --profile tdc \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled 2>/dev/null

# Configurar tags do S3
aws s3api put-bucket-tagging \
    --profile tdc \
    --bucket $BUCKET_NAME \
    --tagging 'TagSet=[{Key=Environment,Value=development},{Key=Project,Value=tdc-checkin}]' 2>/dev/null

echo "✅ Bucket S3 configurado"

# Criar collection Rekognition
echo "👁️  Criando collection Rekognition: $COLLECTION_ID"
aws rekognition create-collection \
    --profile tdc \
    --region $REGION \
    --collection-id $COLLECTION_ID \
    --tags Environment=development,Project=tdc-checkin \
    --no-cli-pager 2>/dev/null || echo "Collection já existe"

echo "✅ Collection Rekognition configurada"

# Verificar acesso ao Bedrock
echo "🤖 Verificando acesso ao Bedrock..."
if aws bedrock list-foundation-models --profile tdc --region $REGION --no-cli-pager > /dev/null 2>&1; then
    echo "✅ Bedrock acessível"
    
    # Listar modelos disponíveis
    echo "📋 Modelos Bedrock disponíveis:"
    aws bedrock list-foundation-models \
        --profile tdc \
        --region $REGION \
        --query 'modelSummaries[?contains(modelId, `claude`)].{ModelId:modelId,Name:modelName}' \
        --output table \
        --no-cli-pager 2>/dev/null || echo "   Nenhum modelo Claude encontrado"
else
    echo "⚠️  Bedrock pode não estar disponível"
    echo "   Solicite acesso aos modelos no console AWS Bedrock:"
    echo "   https://console.aws.amazon.com/bedrock/home?region=$REGION#/modelaccess"
fi

# Criar política IAM para desenvolvimento (opcional)
echo "🔐 Criando política IAM para desenvolvimento..."
POLICY_NAME=EventCheckinDevelopmentPolicy
POLICY_DOC='{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            "Resource": [
                "arn:aws:dynamodb:'$REGION':*:table/event-participants",
                "arn:aws:dynamodb:'$REGION':*:table/event-participants/index/*",
                "arn:aws:dynamodb:'$REGION':*:table/event-checkins",
                "arn:aws:dynamodb:'$REGION':*:table/event-checkins/index/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "rekognition:IndexFaces",
                "rekognition:SearchFacesByImage",
                "rekognition:DeleteFaces",
                "rekognition:ListFaces"
            ],
            "Resource": "arn:aws:rekognition:'$REGION':*:collection/'$COLLECTION_ID'"
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel"
            ],
            "Resource": "arn:aws:bedrock:'$REGION'::foundation-model/anthropic.claude-*"
        }
    ]
}'

aws iam create-policy \
    --profile tdc \
    --policy-name $POLICY_NAME \
    --policy-document "$POLICY_DOC" \
    --description "Política para desenvolvimento do Event Checkin System" \
    --no-cli-pager 2>/dev/null || echo "Política IAM já existe"

echo "✅ Política IAM configurada"

# Verificar recursos criados
echo ""
echo "🔍 Verificando recursos criados..."

# Verificar tabelas DynamoDB
echo "📊 Tabelas DynamoDB:"
aws dynamodb list-tables --profile tdc --region $REGION --query 'TableNames[?contains(@, `event-`)]' --output table --no-cli-pager

# Verificar bucket S3
echo "📦 Buckets S3:"
aws s3 ls --profile tdc | grep event-checkin || echo "Nenhum bucket encontrado"

# Verificar collection Rekognition
echo "👁️  Collections Rekognition:"
aws rekognition list-collections --profile tdc --region $REGION --query 'CollectionIds[?contains(@, `event-`)]' --output table --no-cli-pager

echo ""
echo "✅ Setup AWS completo!"
echo "📝 Recursos criados:"
echo "   - DynamoDB: event-participants, event-checkins"
echo "   - S3 Bucket: $BUCKET_NAME (com CORS e versionamento)"
echo "   - Rekognition Collection: $COLLECTION_ID"
echo "   - IAM Policy: $POLICY_NAME"
echo "   - Região: $REGION"
echo "   - Perfil: tdc"
echo ""
echo "🚀 Agora você pode executar:"
echo "   npm run dev (para iniciar o desenvolvimento)"
echo "   npm test (para executar os testes)"
