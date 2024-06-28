#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables from ../server/.env
export $(grep -v '^#' ../server/.env | xargs)

# Set stack names and template files
REDIS_STACK_NAME="ai-code-heist-redis-stack"
APP_STACK_NAME="ai-code-heist-app-stack"
REDIS_TEMPLATE_FILE="deploy-redis.yaml"
APP_TEMPLATE_FILE="deploy-ecs.yaml"
IMAGE_TAG="latest"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)

# Deploy the Redis CloudFormation stack
echo "Deploying the Redis stack..."
aws cloudformation deploy \
  --template-file $REDIS_TEMPLATE_FILE \
  --stack-name $REDIS_STACK_NAME \
  --capabilities CAPABILITY_IAM

# Wait until the Redis stack is created
echo "Waiting for Redis stack to be created..."
aws cloudformation wait stack-create-complete --stack-name $REDIS_STACK_NAME

# Fetch the necessary values using AWS CLI
echo "Fetching necessary values using AWS CLI..."
VPC_ID=$(aws cloudformation describe-stacks --stack-name $REDIS_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='VPCId'].OutputValue" --output text)
PRIVATE_SUBNET_ID=$(aws cloudformation describe-stacks --stack-name $REDIS_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='PrivateSubnetId'].OutputValue" --output text)
SECURITY_GROUP_ID=$(aws cloudformation describe-stacks --stack-name $REDIS_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupId'].OutputValue" --output text)

# Fetch the Redis cluster endpoint and port using AWS CLI
REDIS_CLUSTER_INFO=$(aws elasticache describe-cache-clusters --cache-cluster-id ai-code-heist-redis --show-cache-node-info)
REDIS_CLUSTER_ENDPOINT=$(echo $REDIS_CLUSTER_INFO | jq -r '.CacheClusters[0].CacheNodes[0].Endpoint.Address')
REDIS_CLUSTER_PORT=$(echo $REDIS_CLUSTER_INFO | jq -r '.CacheClusters[0].CacheNodes[0].Endpoint.Port')

echo "Redis cluster endpoint: $REDIS_CLUSTER_ENDPOINT:$REDIS_CLUSTER_PORT"

# Deploy the ECS and ALB CloudFormation stack
echo "Deploying the ECS and ALB stack..."
aws cloudformation deploy \
  --template-file $APP_TEMPLATE_FILE \
  --stack-name $APP_STACK_NAME \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
      VPCId=$VPC_ID \
      PrivateSubnetId=$PRIVATE_SUBNET_ID \
      SecurityGroupId=$SECURITY_GROUP_ID \
      ECRRepositoryURI=$ECR_REPOSITORY_URI \
      ImageTag=$IMAGE_TAG \
      EnvironmentName="ai-code-heist" \
      OpenAIApiKey=$OPENAI_API_KEY \
      AdminKey=$ADMIN_KEY \
      SecretKey=$SECRET_KEY \
      PrivateS3=$PRIVATE_S3 \
      AccountId=$AWS_ACCOUNT_ID

# Wait until the ECS and ALB stack is created
echo "Waiting for ECS and ALB stack to be created..."
aws cloudformation wait stack-create-complete --stack-name $APP_STACK_NAME

# Fetch the ALB endpoint
ALB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $APP_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ALBEndpoint'].OutputValue" --output text)

echo "ALB endpoint: $ALB_ENDPOINT"