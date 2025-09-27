# Custom Eclipse Ditto Gateway Build Script (PowerShell)
# Builds the custom Gateway Docker image with Force-Up bootstrap support

param(
    [string]$ImageName = "eclipse/ditto-gateway-custom",
    [string]$ImageTag = "3.5.0-force-up"
)

Write-Host "======================================================" -ForegroundColor Green
Write-Host "Building Custom Eclipse Ditto Gateway with Force-Up" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green

$FullImageName = "${ImageName}:${ImageTag}"

Write-Host "Image Name: $FullImageName" -ForegroundColor Yellow
Write-Host "Build Context: $(Get-Location)" -ForegroundColor Yellow

# Ensure we're in the correct directory
if (-not (Test-Path "Dockerfile")) {
    Write-Host "ERROR: Dockerfile not found in current directory" -ForegroundColor Red
    Write-Host "Please run this script from the ditto-custom-gateway directory" -ForegroundColor Red
    exit 1
}

# Check if required files exist
Write-Host "Checking required files..." -ForegroundColor Cyan
$RequiredFiles = @(
    "Dockerfile",
    "gateway.conf",
    "GatewayBootstrapConfig.java",
    "DittoGatewayConfigCustom.java", 
    "DittoServiceCustom.java",
    "GatewayServiceCustom.java"
)

foreach ($file in $RequiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "ERROR: Required file $file not found" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Found: $file" -ForegroundColor Green
}

Write-Host "All required files present." -ForegroundColor Green

# Build the Docker image
Write-Host ""
Write-Host "Building Docker image..." -ForegroundColor Cyan
Write-Host "Command: docker build -t $FullImageName ." -ForegroundColor Gray

try {
    & docker build -t $FullImageName .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "======================================================" -ForegroundColor Green
        Write-Host "✅ SUCCESS: Custom Gateway image built successfully!" -ForegroundColor Green
        Write-Host "======================================================" -ForegroundColor Green
        Write-Host "Image: $FullImageName" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To use this image, update your docker-compose.yaml:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "ditto-gateway:" -ForegroundColor White
        Write-Host "  image: $FullImageName" -ForegroundColor White
        Write-Host "  environment:" -ForegroundColor White
        Write-Host "    - DITTO_GATEWAY_BOOTSTRAP_FORCE_UP=true" -ForegroundColor White
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Update docker-compose-final.yaml to use the custom image" -ForegroundColor White
        Write-Host "2. Start the services with: docker-compose -f docker-compose-final.yaml up -d" -ForegroundColor White
        Write-Host "3. Test Gateway HTTP API at: http://localhost:8080" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "======================================================" -ForegroundColor Red
        Write-Host "❌ ERROR: Docker build failed!" -ForegroundColor Red
        Write-Host "======================================================" -ForegroundColor Red
        Write-Host "Please check the build output above for error details." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: Failed to execute docker build command" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Show image information
Write-Host "Docker image information:" -ForegroundColor Cyan
& docker images | Select-String $ImageName | Select-Object -First 5