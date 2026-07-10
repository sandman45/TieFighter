output "instance_id" {
  description = "EC2 instance ID — set this as the EC2_INSTANCE_ID GitHub repo variable."
  value       = aws_instance.tiefighter.id
}

output "public_ip" {
  value = aws_eip.tiefighter.public_ip
}

output "domain_name" {
  value = local.domain_name
}
