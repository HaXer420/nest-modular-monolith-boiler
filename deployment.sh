#!/bin/bash
set -euo pipefail

AWS_ACCOUNT_ID="${1:?AWS account id is required}"
AWS_REGION="${2:?AWS region is required}"
IMAGE_REPO_NAME="${3:?ECR image repository name is required}"
IMAGE_TAG="${4:?Docker image tag is required}"
CONTAINER_NAME="${5:-nest-boiler-backend}"
PORT="${PORT:-4700}"
ENV_FILE="${ENV_FILE:-.env}"

IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${IMAGE_REPO_NAME}:${IMAGE_TAG}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

docker pull "$IMAGE_URI"

docker stop "$CONTAINER_NAME" || true
docker rm "$CONTAINER_NAME" || true

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -p "${PORT}:4700" \
  "$IMAGE_URI"
