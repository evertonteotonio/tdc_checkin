const AWS = require('aws-sdk');

// Configuração para usar perfil específico
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// Usar perfil específico se definido
if (process.env.AWS_PROFILE) {
  process.env.AWS_SDK_LOAD_CONFIG = '1';
  AWS.config.credentials = new AWS.SharedIniFileCredentials({
    profile: process.env.AWS_PROFILE
  });
}

AWS.config.update(awsConfig);

// Instâncias dos serviços (todos usando AWS real)
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();
const bedrock = new AWS.BedrockRuntime();

module.exports = {
  AWS,
  dynamodb,
  s3,
  rekognition,
  bedrock,
  config: awsConfig
};
