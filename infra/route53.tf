data "aws_route53_zone" "this" {
  name = var.route53_zone_name
}

resource "aws_route53_record" "tiefighter" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = local.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.tiefighter.public_ip]
}
