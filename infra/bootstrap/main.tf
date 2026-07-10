## One-time bootstrap: Terraform state backend + GitHub Actions OIDC.
##
## This is a SEPARATE Terraform root from ../ with its own (local) state,
## applied once by hand. It creates the S3 bucket + DynamoDB lock table
## that ../ uses as its remote backend, plus the IAM roles GitHub Actions
## assumes via OIDC (no long-lived AWS keys stored in GitHub).
##
## See ../README.md for the full bootstrap procedure.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# --- Terraform remote state backend ---

resource "aws_s3_bucket" "tf_state" {
  bucket = var.state_bucket_name

  # Protect the state bucket from `terraform destroy` in this root; it
  # should only ever be removed deliberately.
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "tf_state" {
  bucket                  = aws_s3_bucket.tf_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_dynamodb_table" "tf_lock" {
  name         = var.state_lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

# --- GitHub Actions OIDC provider ---

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  # GitHub's OIDC thumbprint (Actions' own TLS chain is now covered by
  # this well-known root thumbprint; AWS also validates the audience above).
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# Role assumed by deploy.yml (push to master only): just enough SSM
# access to run the deploy script on the one tagged instance.
resource "aws_iam_role" "gh_actions_deploy" {
  name = "gh-actions-tiefighter-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/master"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "gh_actions_deploy_ssm" {
  name = "ssm-send-command"
  role = aws_iam_role.gh_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "SendCommandToDocument"
        Effect   = "Allow"
        Action   = "ssm:SendCommand"
        Resource = "arn:aws:ssm:${var.aws_region}::document/AWS-RunShellScript"
      },
      {
        Sid      = "SendCommandToTaggedInstance"
        Effect   = "Allow"
        Action   = "ssm:SendCommand"
        Resource = "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/*"
        Condition = {
          StringEquals = {
            "ssm:resourceTag/Name" = var.instance_name_tag
          }
        }
      },
      {
        Sid      = "ReadCommandResults"
        Effect   = "Allow"
        Action   = ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations"]
        Resource = "*"
      }
    ]
  })
}

# Role assumed by terraform.yml (any branch/PR): read-only, for `plan`
# previews. Uses the AWS managed ReadOnlyAccess policy for simplicity —
# broader than strictly necessary, but this role can never change
# infrastructure.
resource "aws_iam_role" "gh_actions_terraform_plan" {
  name = "gh-actions-tiefighter-terraform-plan"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:*"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "gh_actions_terraform_plan_readonly" {
  role       = aws_iam_role.gh_actions_terraform_plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# ReadOnlyAccess doesn't cover the state lock: even a read-only `plan`
# still acquires/releases the S3 backend's DynamoDB lock, which needs
# write access to that one table.
resource "aws_iam_role_policy" "gh_actions_terraform_plan_state_lock" {
  name = "state-lock"
  role = aws_iam_role.gh_actions_terraform_plan.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "StateLockTable"
      Effect   = "Allow"
      Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
      Resource = aws_dynamodb_table.tf_lock.arn
    }]
  })
}
