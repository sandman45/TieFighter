# Reserved Instance: this account has a 1-year Standard RI for a t3.micro in us-east-1
# (332fa6c7-73bb-4526-8640-f4b24eda20b8, No Upfront, $0.0065/hr), running 2026-11-20 to
# 2027-11-20. It's billed for the full term whether or not the instance is running. Until it
# expires, keep the instance a t3 in us-east-1: the discount only covers that family and region
# (size-flexible, so a t3.small gets half coverage), and anything else is billed at on-demand
# rates on top of the RI. Details in ~/WebstormProjects/aws-account-notes/billing-and-costs.md.

variable "aws_region" {
  description = "AWS region to deploy into. Keep us-east-1 until 2027-11-20 (Reserved Instance, see above)."
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type. Keep t3.micro until 2027-11-20 (Reserved Instance, see above)."
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
