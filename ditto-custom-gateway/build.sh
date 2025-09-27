#!/bin/bash

# Custom Eclipse Ditto Gateway Build Script
# Builds the custom Gateway Docker image with Force-Up bootstrap support

set -e

echo "======================================================"
echo "Building Custom Eclipse Ditto Gateway with Force-Up"
echo "======================================================"

# Configuration
IMAGE_NAME="eclipse/ditto-gateway-custom"
IMAGE_TAG="3.5.0-force-up"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

echo "Image Name: ${FULL_IMAGE_NAME}"
echo "Build Context: $(pwd)"

# Ensure we're in the correct directory
if [ ! -f "Dockerfile" ]; then
    echo "ERROR: Dockerfile not found in current directory"
    echo "Please run this script from the ditto-custom-gateway directory"
    exit 1
fi

# Check if required files exist
echo "Checking required files..."
REQUIRED_FILES=(
    "Dockerfile"
    "gateway.conf"
    "GatewayBootstrapConfig.java"
    "DittoGatewayConfigCustom.java"
    "DittoServiceCustom.java"
    "GatewayServiceCustom.java"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Required file $file not found"
        exit 1
    fi
    echo "✓ Found: $file"
done

echo "All required files present."

# Build the Docker image
echo ""
echo "Building Docker image..."
echo "Command: docker build -t ${FULL_IMAGE_NAME} ."

docker build -t "${FULL_IMAGE_NAME}" .

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================================"
    echo "✅ SUCCESS: Custom Gateway image built successfully!"
    echo "======================================================"
    echo "Image: ${FULL_IMAGE_NAME}"
    echo ""
    echo "To use this image, update your docker-compose.yaml:"
    echo ""
    echo "ditto-gateway:"
    echo "  image: ${FULL_IMAGE_NAME}"
    echo "  environment:"
    echo "    - DITTO_GATEWAY_BOOTSTRAP_FORCE_UP=true"
    echo ""
    echo "Next steps:"
    echo "1. Update docker-compose-final.yaml to use the custom image"
    echo "2. Start the services with: docker-compose -f docker-compose-final.yaml up -d"
    echo "3. Test Gateway HTTP API at: http://localhost:8080"
    echo ""
else
    echo ""
    echo "======================================================"
    echo "❌ ERROR: Docker build failed!"
    echo "======================================================"
    echo "Please check the build output above for error details."
    exit 1
fi

# Show image information
echo "Docker image information:"
docker images | grep "${IMAGE_NAME}" | head -5