#!/bin/bash

# Set stack names
REDIS_STACK_NAME="ai-code-heist-redis-stack"
APP_STACK_NAME="ai-code-heist-app-stack"

# Delete the ECS CloudFormation stack
echo "Deleting the ECS stack..."
aws cloudformation delete-stack --stack-name $APP_STACK_NAME

# Wait until the ECS stack is deleted
echo "Waiting for the ECS stack to be deleted..."
aws cloudformation wait stack-delete-complete --stack-name $APP_STACK_NAME
echo "ECS stack deleted."

# Delete the Redis CloudFormation stack
echo "Deleting the Redis stack..."
aws cloudformation delete-stack --stack-name $REDIS_STACK_NAME

# Wait until the Redis stack is deleted
echo "Waiting for the Redis stack to be deleted..."
aws cloudformation wait stack-delete-complete --stack-name $REDIS_STACK_NAME
echo "Redis stack deleted."

echo "All resources have been cleaned up."
