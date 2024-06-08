#!/bin/bash

echo "Deleting resources..."
# Delete Kubernetes secrets and ConfigMap
kubectl delete secret ai-code-heist-secrets
kubectl delete configmap firebase-config


echo "Deleting EKS Cluster..."
# Delete the EKS cluster stack
aws cloudformation delete-stack --stack-name ai-code-heist-eks-cluster


echo "Waiting for EKS Cluster to be deleted..."
# Wait for the stack to be deleted
aws cloudformation wait stack-delete-complete --stack-name ai-code-heist-eks-cluster
