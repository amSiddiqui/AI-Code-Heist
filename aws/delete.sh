#!/bin/bash


echo "Deleting resources..."
# Delete Redis Cluster
./delete-redis.sh

echo "Deleting EKS Cluster..."
# Delete EKS Cluster
./deleteEKS.sh

echo "Deletion complete."