#!/bin/bash
aws configure set region eu-west-2

# deploy redis cache
./deploy-redis.sh

echo "Deploying EKS Cluster..."

# deploy EKS cluster
./deployEKS.sh

echo "Deployment complete."