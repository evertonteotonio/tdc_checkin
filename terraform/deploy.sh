#!/bin/bash

set -e

echo "🚀 Deploying Event Checkin System to AWS..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity --profile tdc > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured with 'tdc' profile"
    echo "Run: aws configure --profile tdc"
    exit 1
fi

# Initialize Terraform
echo "📦 Initializing Terraform..."
terraform init

# Plan deployment
echo "📋 Planning deployment..."
terraform plan -var-file="terraform.tfvars"

# Apply deployment
echo "🔨 Applying deployment..."
terraform apply -var-file="terraform.tfvars" -auto-approve

# Get outputs
echo "📊 Deployment completed! URLs:"
echo "API Gateway: $(terraform output -raw api_gateway_url)"
echo "Frontend: $(terraform output -raw cloudfront_url)"
echo "S3 Photos Bucket: $(terraform output -raw s3_photos_bucket)"
echo "S3 Frontend Bucket: $(terraform output -raw s3_frontend_bucket)"

echo "✅ Deployment successful!"
