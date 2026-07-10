# Infrastructure

Terraform-managed EC2 deployment for the TIE Fighter server, plus GitHub
Actions workflows that deploy on every push to `master`.

- `bootstrap/` — one-time setup: the Terraform state backend (S3 +
  DynamoDB) and the IAM roles GitHub Actions assumes via OIDC. Its own
  Terraform root, its own (local) state. You run this once, by hand.
- everything else in `infra/` — the actual game server: EC2 instance,
  Elastic IP, security group, instance IAM role, Route53 record. Uses
  the S3 backend `bootstrap/` created.

No SSH keypair anywhere: shell access is via SSM Session Manager, and
deploys are triggered by GitHub Actions via `aws ssm send-command`
(see `.github/workflows/deploy.yml`).

## First-time setup

Requires the AWS CLI configured locally with credentials that can create
S3/DynamoDB/IAM resources.

### 1. Bootstrap the state backend + OIDC roles

```
cd infra/bootstrap
terraform init
terraform apply
```

Note the outputs — you'll need `gh_actions_deploy_role_arn` and
`gh_actions_terraform_plan_role_arn` in step 3.

If `state_bucket_name` (default `tiefighter-tfstate`) is already taken
globally on S3, override it: `terraform apply -var state_bucket_name=<something-unique>`
— and update the bucket name in `../backend.tf` to match.

### 2. Apply the main infrastructure

```
cd infra
terraform init
terraform apply
```

This creates the EC2 instance, EIP, and Route53 record, and boots the
app via `user_data.sh.tpl` (installs Node/nginx/pm2, clones the repo,
starts the server with pm2, configures nginx as a WebSocket-aware
reverse proxy on port 80 — no TLS yet).

Note the `instance_id` and `domain_name` outputs.

### 3. Configure GitHub repo variables

In the repo's Settings → Secrets and variables → Actions → Variables,
add:

| Variable | Value |
|---|---|
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_DEPLOY_ROLE_ARN` | `gh_actions_deploy_role_arn` output from bootstrap |
| `AWS_TERRAFORM_PLAN_ROLE_ARN` | `gh_actions_terraform_plan_role_arn` output from bootstrap |
| `EC2_INSTANCE_ID` | `instance_id` output from step 2 |

No AWS access keys are stored anywhere — both roles are assumed via
GitHub's OIDC token.

### 4. Enable TLS

Wait for DNS to propagate, then confirm:

```
dig +short tie-fighter.mattsanders.org
```

...matches the `public_ip` output. Then issue the certificate over SSM
(no SSH needed):

```
aws ssm send-command \
  --instance-ids <instance_id> \
  --document-name AWS-RunShellScript \
  --parameters '{"commands":["certbot --nginx -d tie-fighter.mattsanders.org --non-interactive --agree-tos -m msanders45@gmail.com --redirect"]}'
```

certbot's nginx plugin edits the site config in place to add the 443
server block and HTTP→HTTPS redirect, and installs its own systemd
timer for renewal — no further action needed.

## Day to day

- Pushing to `master` (app code, not `infra/`) triggers
  `.github/workflows/deploy.yml`: it runs `git reset --hard
  origin/master && npm run build && pm2 reload tiefighter` on the
  instance over SSM.
- Opening a PR that touches `infra/**` triggers
  `.github/workflows/terraform.yml`, which runs `plan` only (read-only
  AWS role) so you can review the diff before applying by hand.
- Infra changes themselves (`terraform apply` in `infra/`) are always
  run manually — never automated — since they can be hard to reverse.
- `bootstrap/` should rarely change; if it does, apply it by hand the
  same way as step 1.

## Troubleshooting

- Shell into the instance without SSH: `aws ssm start-session
  --target <instance_id>` (requires the Session Manager plugin for the
  AWS CLI, installed once locally).
- App logs: `pm2 logs tiefighter` on the instance.
- nginx config: `/etc/nginx/conf.d/tiefighter.conf`.
