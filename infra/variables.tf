variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
  default     = "t3.micro"
}

variable "instance_name_tag" {
  description = "Name tag on the instance. Must match infra/bootstrap's instance_name_tag (the deploy IAM role is scoped to this tag)."
  type        = string
  default     = "tiefighter"
}

variable "repo_url" {
  description = "Public git URL the instance clones on boot and pulls on deploy."
  type        = string
  default     = "https://github.com/sandman45/TieFighter.git"
}

variable "app_port" {
  description = "Port the Node server listens on (WEB_SERVER env var), proxied by nginx."
  type        = string
  default     = "3000"
}

variable "route53_zone_name" {
  description = "Existing Route53 hosted zone name (must already exist)."
  type        = string
  default     = "mattsanders.org"
}

variable "subdomain" {
  description = "Subdomain the game is served at, relative to route53_zone_name."
  type        = string
  default     = "tie-fighter"
}
