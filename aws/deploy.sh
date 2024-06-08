#!/bin/bash
aws configure set region eu-west-2

# deploy redis cache
./deploy-redis.sh


echo "Deployment complete."