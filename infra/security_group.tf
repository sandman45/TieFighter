## No port 22 — shell access goes through SSM Session Manager instead
## of SSH (see iam.tf for the instance's SSM permissions).

resource "aws_security_group" "tiefighter" {
  name        = "tiefighter"
  description = "TIE Fighter game server: HTTP/HTTPS only, no SSH"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP (redirects to HTTPS, and serves ACME challenges)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = var.instance_name_tag
  }
}
