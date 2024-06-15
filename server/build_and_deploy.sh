#!/bin/bash

# Variables
IMAGE_NAME="ai-code-heist"
ECR_REGISTRY="736435290091.dkr.ecr.eu-west-2.amazonaws.com"
ECR_REPOSITORY="${ECR_REGISTRY}/${IMAGE_NAME}"
PLATFORM="linux/amd64"

# Rebuild the Docker image for the specified platform
docker buildx build --platform ${PLATFORM} -t ${IMAGE_NAME}:latest --load .

# Tag the Docker image
docker tag ${IMAGE_NAME}:latest ${ECR_REPOSITORY}:latest

# Log in to Amazon ECR
aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Push the Docker image to Amazon ECR
docker push ${ECR_REPOSITORY}:latest