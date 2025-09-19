output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_api_gateway_deployment.api.invoke_url
}

output "cloudfront_url" {
  description = "CloudFront Distribution URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "s3_photos_bucket" {
  description = "S3 bucket for photos"
  value       = aws_s3_bucket.photos.bucket
}

output "s3_frontend_bucket" {
  description = "S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.bucket
}

output "dynamodb_table" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.participants.name
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api.function_name
}
