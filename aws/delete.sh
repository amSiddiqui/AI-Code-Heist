#!/bin/bash

# Set stack names
REDIS_STACK_NAME="ai-code-heist-redis-stack"
APP_STACK_NAME="ai-code-heist-app-stack"

# Delete the App Runner CloudFormation stack
echo "Deleting the App Runner stack..."
aws cloudformation delete-stack --stack-name $APP_STACK_NAME

# Wait until the App Runner stack is deleted
echo "Waiting for the App Runner stack to be deleted..."
aws cloudformation wait stack-delete-complete --stack-name $APP_STACK_NAME
echo "App Runner stack deleted."

# Delete the Redis CloudFormation stack
echo "Deleting the Redis stack..."
aws cloudformation delete-stack --stack-name $REDIS_STACK_NAME

# Wait until the Redis stack is deleted
echo "Waiting for the Redis stack to be deleted..."
aws cloudformation wait stack-delete-complete --stack-name $REDIS_STACK_NAME
echo "Redis stack deleted."

echo "All resources have been cleaned up."
