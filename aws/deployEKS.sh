#!/bin/bash

echo "Loading environment variables"

ENV_FILE_LOCATION=../server/.env

# check if file exists and is readable otherwise exit
if [ ! -f "$ENV_FILE_LOCATION" ] || [ ! -r "$ENV_FILE_LOCATION" ]; then
    echo "File $ENV_FILE_LOCATION does not exist or is not readable"
    exit 1
fi

FIREBASE_SDK=../server/firebase-sdk.json
if [ ! -f "$FIREBASE_SDK" ] || [ ! -r "$FIREBASE_SDK" ]; then
    echo "File $FIREBASE_SDK does not exist or is not readable"
    exit 1
fi
export $(grep -v '^#' $ENV_FILE_LOCATION | xargs)

echo "Creating EKS Cluster"

# create cluster
aws cloudformation create-stack --region eu-west-2 --stack-name ai-code-heist-eks-cluster \
  --template-body file://eks-cluster.yaml \
  --capabilities CAPABILITY_IAM


echo "Waiting for EKS Cluster to be created"

# Wait for the stack to be created
aws cloudformation wait stack-create-complete --stack-name ai-code-heist-eks-cluster
REDIS_URL=$(aws ssm get-parameter --name "/ai-code-heist/redis-url" --query "Parameter.Value" --output text)

# retrieve the kubeconfig file
aws eks update-kubeconfig --name ai-code-heist-eks-cluster

AWS_ACCOUNT_ID=$(aws ssm get-parameter --name "/ai-code-heist/account-id" --query "Parameter.Value" --output text --region eu-west-2)

# Apply environment variables as Kubernetes secrets
kubectl create secret generic ai-code-heist-secrets \
  --from-literal=OPENAI_API_KEY=$OPENAI_API_KEY \
  --from-literal=ADMIN_KEY=$ADMIN_KEY \
  --from-literal=SECRET_KEY=$SECRET_KEY \
  --from-literal=REDIS_URL=$REDIS_URL

kubectl create configmap firebase-config --from-file=$FIREBASE_SDK

sed "s/{{AWS_ACCOUNT_ID}}/$AWS_ACCOUNT_ID/g" deployment.yaml.template > deployment.yaml

# Deploy the application
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

