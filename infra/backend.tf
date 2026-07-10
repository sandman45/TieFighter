## Remote state backend, created by ./bootstrap (applied once, separately).
## Bucket/table names must match infra/bootstrap/variables.tf's defaults
## (or whatever values you passed there).

terraform {
  backend "s3" {
    bucket         = "tiefighter-tfstate"
    key            = "tiefighter/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tiefighter-tflock"
    encrypt        = true
  }
}
