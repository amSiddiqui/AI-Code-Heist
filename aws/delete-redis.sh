#!/bin/bash
STACK_NAME="ai-code-heist-redis-stack"

echo "Deleting Redis Cluster..."
aws cloudformation delete-stack --stack-name $STACK_NAME

echo "Waiting for stack to be deleted..."
aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME

echo "Redis Cluster deleted successfully."

# clean up ssm parameter
aws ssm delete-parameter --name "/ai-code-heist/redis-url"