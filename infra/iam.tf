## Instance role: lets the SSM agent register the instance and lets
## deploy.yml's ssm:SendCommand actually reach it. No SSH keypair needed.

resource "aws_iam_role" "instance" {
  name = "tiefighter-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "instance_ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "instance" {
  name = "tiefighter-instance"
  role = aws_iam_role.instance.name
}
