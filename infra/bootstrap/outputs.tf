output "state_bucket_name" {
  value = aws_s3_bucket.tf_state.bucket
}

output "state_lock_table_name" {
  value = aws_dynamodb_table.tf_lock.name
}

output "gh_actions_deploy_role_arn" {
  value = aws_iam_role.gh_actions_deploy.arn
}

output "gh_actions_terraform_plan_role_arn" {
  value = aws_iam_role.gh_actions_terraform_plan.arn
}
