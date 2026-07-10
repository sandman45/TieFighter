data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

locals {
  domain_name = "${var.subdomain}.${var.route53_zone_name}"
}

resource "aws_instance" "tiefighter" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.tiefighter.id]
  iam_instance_profile   = aws_iam_instance_profile.instance.name

  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    repo_url    = var.repo_url
    app_port    = var.app_port
    domain_name = local.domain_name
  })

  # Changing user_data alone doesn't restart the instance to re-run it;
  # bump this if you need a fresh boot after editing the script.
  user_data_replace_on_change = true

  tags = {
    Name = var.instance_name_tag
  }
}

resource "aws_eip" "tiefighter" {
  instance = aws_instance.tiefighter.id
  domain   = "vpc"

  tags = {
    Name = var.instance_name_tag
  }
}
