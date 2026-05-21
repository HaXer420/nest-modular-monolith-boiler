# Deployment Guide

This guide explains the deployment setup included with this boilerplate.

The current deployment path is:

```text
GitHub Actions -> Docker build -> Amazon ECR -> AWS SSM -> EC2 Docker container
```

There is no CodeBuild step in this flow. The GitHub Actions workflow owns the build, image push, and remote EC2 deployment trigger.

## Contents

- [Architecture](#architecture)
- [Files Involved](#files-involved)
- [AWS Services Used](#aws-services-used)
- [Required GitHub Secrets](#required-github-secrets)
- [EC2 Requirements](#ec2-requirements)
- [ECR Setup](#ecr-setup)
- [IAM Permissions](#iam-permissions)
- [Application Environment](#application-environment)
- [Deployment Lifecycle](#deployment-lifecycle)
- [How Deployment Works](#how-deployment-works)
- [Manual Deployment](#manual-deployment)
- [Rollback](#rollback)
- [Health Check](#health-check)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)

## Architecture

The deployment is intentionally simple:

1. A push to `main` starts GitHub Actions.
2. GitHub Actions checks out the repository.
3. GitHub Actions authenticates to AWS.
4. GitHub Actions builds the Docker image.
5. The image is tagged as:
   - `latest`
   - the current GitHub commit SHA
6. Both tags are pushed to Amazon ECR.
7. GitHub Actions base64-encodes:
   - `deployment.sh`
   - the `APP_ENV` GitHub secret
8. GitHub Actions sends an SSM command to the EC2 instance.
9. EC2 writes:
   - `deployment.sh`
   - `.env`
10. EC2 runs `deployment.sh`.
11. `deployment.sh` pulls the new ECR image.
12. The old container is stopped and removed.
13. A new container is started with `--restart unless-stopped`.

## Deployment Lifecycle

```mermaid
flowchart LR
  A[Developer pushes to main] --> B[GitHub Actions starts]
  B --> C[Checkout repository]
  C --> D[Configure AWS credentials]
  D --> E[Login to Amazon ECR]
  E --> F[Build Docker image]
  F --> G[Tag image as latest and commit SHA]
  G --> H[Push image tags to ECR]
  H --> I[Encode deployment.sh and APP_ENV]
  I --> J[Send AWS SSM command to EC2]
  J --> K[Write deployment.sh and .env on EC2]
  K --> L[Run deployment.sh]
  L --> M[EC2 logs in to ECR]
  M --> N[Pull commit SHA image]
  N --> O[Stop and remove old container]
  O --> P[Start new Docker container]
  P --> Q[Health check /v1/health-check]
```

## Files Involved

```text
.github/workflows/deploy.yml
deployment.sh
Dockerfile
```

### `.github/workflows/deploy.yml`

This is the GitHub Actions workflow.

It is triggered by:

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
```

That means deployment runs when:

- code is pushed to `main`
- someone manually clicks **Run workflow** in GitHub Actions

### `deployment.sh`

This script runs on the EC2 instance through AWS SSM.

It:

- logs in to ECR
- pulls the requested image tag
- stops the old container
- removes the old container
- starts the new container
- loads runtime env vars from `.env`
- maps host port `${PORT:-4700}` to container port `4700`

### `Dockerfile`

The Dockerfile builds the NestJS app and runs:

```bash
node dist/main.js
```

The container exposes port:

```text
4700
```

The built-in Docker health check calls:

```text
GET http://localhost:4700/v1/health-check
```

## AWS Services Used

### Amazon ECR

ECR stores the Docker images.

Image URI format:

```text
<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/<IMAGE_REPO_NAME>:<TAG>
```

Example:

```text
123456789012.dkr.ecr.eu-west-2.amazonaws.com/nest-boiler-backend:latest
```

### Amazon EC2

EC2 runs the Docker container.

The deployment assumes the EC2 instance already exists and has:

- Docker installed
- AWS CLI installed
- SSM Agent installed and running
- IAM instance profile permissions for SSM and ECR pull

### AWS Systems Manager SSM

GitHub Actions uses SSM to execute a shell command on EC2.

This avoids SSH keys in GitHub and keeps deployment controlled through AWS IAM.

## Required GitHub Secrets

Create these in:

```text
GitHub Repository -> Settings -> Secrets and variables -> Actions -> Repository secrets
```

| Secret                  | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `APP_ENV`               | Full production `.env` content. Written to EC2 as `.env`.      |
| `AWS_ACCESS_KEY_ID`     | AWS key used by GitHub Actions.                                |
| `AWS_SECRET_ACCESS_KEY` | AWS secret used by GitHub Actions.                             |
| `AWS_ACCOUNT_ID`        | AWS account id that owns the ECR repository.                   |
| `AWS_REGION`            | AWS region for ECR and SSM.                                    |
| `CONTAINER_NAME`        | Docker container name on EC2.                                  |
| `IMAGE_REPO_NAME`       | ECR repository name.                                           |
| `INSTANCE_ID`           | EC2 instance id, for example `i-0123456789abcdef0`.            |
| `REMOTE_APP_DIR`        | Directory on EC2 where `.env` and `deployment.sh` are written. |

## EC2 Requirements

### Install Docker

On Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
```

Allow the default user to run Docker without `sudo`, if you want:

```bash
sudo usermod -aG docker $USER
```

Log out and back in for the group change to apply.

### Install AWS CLI

Check if it already exists:

```bash
aws --version
```

If missing, install AWS CLI v2 using AWS's official instructions for your OS.

### Verify SSM Agent

On many AWS AMIs, SSM Agent is already installed.

Check status:

```bash
sudo systemctl status amazon-ssm-agent
```

Start and enable it:

```bash
sudo systemctl enable amazon-ssm-agent
sudo systemctl start amazon-ssm-agent
```

### Security Group

Open the public HTTP port you use for the backend.

Default app port:

```text
4700
```

If you put Nginx or a load balancer in front of the app, expose `80` and `443` publicly and keep `4700` private.

## ECR Setup

Create an ECR repository with the same name as `IMAGE_REPO_NAME`.

Using AWS CLI:

```bash
aws ecr create-repository \
  --repository-name nest-boiler-backend \
  --region <AWS_REGION>
```

Use that repository name in GitHub:

```text
IMAGE_REPO_NAME=nest-boiler-backend
```

## IAM Permissions

There are two IAM permission areas:

- GitHub Actions AWS user
- EC2 instance role

### GitHub Actions AWS User

The AWS user or role used by GitHub Actions needs permissions to:

- authenticate to ECR
- push images to ECR
- send SSM commands to the target EC2 instance

Required capability areas:

```text
ecr:GetAuthorizationToken
ecr:BatchCheckLayerAvailability
ecr:InitiateLayerUpload
ecr:UploadLayerPart
ecr:CompleteLayerUpload
ecr:PutImage
ssm:SendCommand
ssm:GetCommandInvocation
ec2:DescribeInstances
```

### EC2 Instance Role

The EC2 instance role needs permissions to:

- register with SSM
- receive SSM commands
- pull images from ECR

Attach AWS managed policy:

```text
AmazonSSMManagedInstanceCore
```

For ECR pull access, the instance role needs:

```text
ecr:GetAuthorizationToken
ecr:BatchCheckLayerAvailability
ecr:GetDownloadUrlForLayer
ecr:BatchGetImage
```

## Application Environment

`APP_ENV` is a GitHub repository secret containing the complete runtime `.env`.

Example:

```env
PORT=4700
NODE_ENV=production
CORS_ALLOWED_ORIGINS=https://api.example.com,https://app.example.com
SWAGGER_ENABLE=false

DATABASE_URI=mongodb+srv://user:password@cluster.example.mongodb.net/nest-boiler

JWT_SECRET=replace-with-a-long-random-production-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GMAIL_USER=
GMAIL_APP_PASSWORD=
GMAIL_SENDER_NAME=Nest Boiler

AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_BUCKET_BASE_URL=
```

Important:

- Do not commit production `.env`.
- Keep `APP_ENV` in GitHub Secrets.
- Rotate secrets if they are ever exposed.
- Use a long random `JWT_SECRET`.
- Set `SWAGGER_ENABLE=false` for public production APIs unless you intentionally expose docs.

## How Deployment Works

### 1. Checkout

GitHub Actions pulls the repository:

```yaml
uses: actions/checkout@v4
```

### 2. AWS Login

The workflow configures AWS credentials:

```yaml
uses: aws-actions/configure-aws-credentials@v4
```

Then logs in to ECR:

```yaml
uses: aws-actions/amazon-ecr-login@v2
```

### 3. Docker Build

The image is built locally inside the GitHub Actions runner:

```bash
docker build -t "$IMAGE_REPO_NAME" .
```

### 4. Docker Tags

The image receives two tags:

```text
latest
<github-sha>
```

The SHA tag is important because it gives every deployment an immutable image reference.

### 5. Push To ECR

Both tags are pushed:

```bash
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_REPO_NAME:latest"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_REPO_NAME:${{ github.sha }}"
```

### 6. Encode Runtime Files

The workflow encodes:

- `deployment.sh`
- `APP_ENV`

This makes it safer to pass multiline content through the SSM command.

### 7. Run Remote Deployment

GitHub Actions sends one SSM command to EC2:

```bash
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --targets "Key=instanceIds,Values=$INSTANCE_ID"
```

The remote command:

- creates `REMOTE_APP_DIR`
- writes `deployment.sh`
- writes `.env`
- sets file permissions
- runs `deployment.sh`

## Manual Deployment

You can run deployment manually from GitHub:

```text
GitHub -> Actions -> Deploy Backend -> Run workflow
```

You can also run `deployment.sh` manually on EC2 if the image already exists in ECR.

Example:

```bash
cd /opt/nest-boiler

./deployment.sh \
  123456789012 \
  eu-west-2 \
  nest-boiler-backend \
  <image-tag-or-github-sha> \
  nest-boiler-backend
```

The `.env` file must exist in the same directory unless you set `ENV_FILE`.

```bash
ENV_FILE=/opt/nest-boiler/.env ./deployment.sh ...
```

## Rollback

Every deployment pushes an image tagged by GitHub commit SHA.

To roll back:

1. Find the previous good SHA in ECR or GitHub Actions history.
2. Run `deployment.sh` with that SHA.

Example:

```bash
./deployment.sh \
  123456789012 \
  eu-west-2 \
  nest-boiler-backend \
  previous-good-sha \
  nest-boiler-backend
```

This pulls and runs the older image.

## Health Check

The app exposes:

```text
GET /v1/health-check
```

Expected response:

```text
OK
```

From EC2:

```bash
curl http://localhost:4700/v1/health-check
```

From your machine:

```bash
curl http://<ec2-public-ip>:4700/v1/health-check
```

Check Docker health:

```bash
docker ps
docker inspect --format='{{json .State.Health}}' <container-name>
```

## Troubleshooting

### GitHub Action Fails At AWS Credential Step

Check these secrets:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
```

Also check that the AWS user has ECR and SSM permissions.

### ECR Login Fails

Check:

- `AWS_ACCOUNT_ID`
- `AWS_REGION`
- ECR repository exists
- AWS user has `ecr:GetAuthorizationToken`

### Docker Push Fails

Check:

- `IMAGE_REPO_NAME` matches the ECR repository name
- ECR repository exists in the same region
- AWS user has ECR push permissions

### SSM Command Fails

Check:

- `INSTANCE_ID` is correct
- EC2 has SSM Agent installed and running
- EC2 instance role has `AmazonSSMManagedInstanceCore`
- EC2 appears in AWS Systems Manager managed nodes
- GitHub AWS user can call `ssm:SendCommand`

### Container Starts Then Exits

SSH or SSM into EC2 and run:

```bash
docker ps -a
docker logs <container-name>
```

Common causes:

- missing `DATABASE_URI`
- invalid `JWT_SECRET`
- MongoDB network access blocked
- app port already used
- malformed multiline env value

### Health Check Fails

Check:

```bash
docker logs <container-name>
curl http://localhost:4700/v1/health-check
```

If the app is behind Nginx or a load balancer, also check proxy rules and security groups.

### New Env Vars Are Not Applying

Update the `APP_ENV` GitHub secret, then rerun the deployment workflow.

The workflow writes `APP_ENV` to:

```text
<REMOTE_APP_DIR>/.env
```

The container is recreated with:

```bash
--env-file .env
```

## Security Notes

- Prefer SSM over SSH for automated deployment.
- Keep production values in GitHub Secrets, not in the repository.
- Use least-privilege IAM policies.
- Keep EC2 inbound ports minimal.
- Use HTTPS in front of production APIs.
- Disable public Swagger docs in production unless intentionally exposed.
- Rotate AWS keys periodically.
- Rotate `JWT_SECRET` carefully because existing tokens become invalid.
- Avoid using `latest` for rollbacks; use the commit SHA tag.
- Keep MongoDB network access restricted to trusted IPs or VPC access.

## What This Guide Does Not Cover

This guide does not cover:

- Terraform
- CloudFormation
- ECS
- Kubernetes
- Load balancer setup
- Nginx setup
- SSL certificate setup
- Blue-green deployments
- Zero-downtime rolling deployments

Those can be added later without changing the app architecture.
