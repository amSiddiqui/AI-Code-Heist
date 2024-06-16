#!/bin/bash

# Load ECR_REECR_REPOSITORY_URI  from .env file
export $(cat .env | xargs)
# Variables
IMAGE_NAME="ai-code-heist"
PLATFORM="linux/amd64"

# Rebuild the Docker image for the specified platform
docker buildx build --platform ${PLATFORM} -t ${IMAGE_NAME}:latest --load .

# Tag the Docker image
docker tag ${IMAGE_NAME}:latest ${ECR_REPOSITORY_URI}:latest

# Log in to Amazon ECR
aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin ${ECR_REPOSITORY_URI}

# Push the Docker image to Amazon ECR
docker push ${ECR_REPOSITORY_URI}:latest