#!/bin/bash
STACK_NAME="ai-code-heist-redis-stack"
TEMPLATE_FILE="redis-cluster.yaml"

echo "Deploying Redis Cluster..."
aws cloudformation create-stack --stack-name $STACK_NAME --template-body file://$TEMPLATE_FILE

echo "Waiting for stack to be created..."
aws cloudformation wait stack-create-complete --stack-name $STACK_NAME

echo "Redis Cluster deployed successfully."

# Get the CacheClusterId from the stack outputs
CACHE_CLUSTER_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CacheClusterId'].OutputValue" --output text)

# Get the endpoint of the Redis cluster
ENDPOINT=$(aws elasticache describe-cache-clusters --cache-cluster-id $CACHE_CLUSTER_ID --show-cache-node-info --query "CacheClusters[0].CacheNodes[0].Endpoint.Address" --output text)

# Print the endpoint
echo "Endpoint: $ENDPOINT"
aws ssm put-parameter --name "/ai-code-heist/redis-url" --value "$ENDPOINT" --type String --overwrite

echo "Endpoint stored in AWS Systems Manager Parameter Store: /ai-code-heist/redis-url"