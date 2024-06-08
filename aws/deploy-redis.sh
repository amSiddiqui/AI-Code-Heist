#!/bin/bash
STACK_NAME="ai-code-heist-redis-stack"
TEMPLATE_FILE="redis-cluster.yaml"

echo "Deploying Redis Cluster..."
aws cloudformation create-stack --stack-name $STACK_NAME --template-body file://$TEMPLATE_FILE

echo "Waiting for stack to be created..."
aws cloudformation wait stack-create-complete --stack-name $STACK_NAME

echo "Redis Cluster deployed successfully."