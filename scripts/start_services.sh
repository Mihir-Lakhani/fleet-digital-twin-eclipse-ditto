#!/bin/bash

# Start Docker Compose services detached
docker-compose up -d

echo "Waiting 15 seconds for services to initialize..."
sleep 15

echo "Checking running containers..."
docker-compose ps

echo "Services started and running."
