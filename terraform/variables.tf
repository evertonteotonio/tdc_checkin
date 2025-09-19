variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "AWS profile"
  type        = string
  default     = "tdc"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "tdc"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "event-checkin"
}
