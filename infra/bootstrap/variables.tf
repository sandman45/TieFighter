variable "aws_region" {
  description = "AWS region for the state bucket/table and IAM (IAM is global, but region is used in ARNs)."
  type        = string
  default     = "us-east-1"
}

variable "state_bucket_name" {
  description = "Globally-unique S3 bucket name for Terraform remote state."
  type        = string
  default     = "tiefighter-tfstate"
}

variable "state_lock_table_name" {
  description = "DynamoDB table name for Terraform state locking."
  type        = string
  default     = "tiefighter-tflock"
}

variable "github_repo" {
  description = "GitHub repo allowed to assume the deploy/plan roles, as owner/name."
  type        = string
  default     = "sandman45/TieFighter"
}

variable "instance_name_tag" {
  description = "Value of the EC2 instance's Name tag (set in ../ec2.tf) that the deploy role is scoped to."
  type        = string
  default     = "tiefighter"
}
