# Digital Twin Docker Services Startup Script
# Enhanced version for the expanded Docker Compose stack

param(
    [switch]$Detached = $true,
    [switch]$Build = $false,
    [switch]$Clean = $false,
    [switch]$Logs = $false
)

Write-Host "Digital Twin Infrastructure - Enhanced Stack" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

# Change to project directory
$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

# Check if Docker is running
Write-Host "Checking Docker Desktop status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✓ Docker Desktop is running" -ForegroundColor Green
}
catch {
    Write-Host "✗ Docker Desktop is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and wait for it to fully initialize." -ForegroundColor Yellow
    exit 1
}

# Clean option - stop and remove containers
if ($Clean) {
    Write-Host "Cleaning up existing containers and volumes..." -ForegroundColor Yellow
    docker-compose down -v --remove-orphans
    docker system prune -f --volumes
    Write-Host "✓ Cleanup completed" -ForegroundColor Green
}

# Build option - rebuild all images
if ($Build) {
    Write-Host "Building all services..." -ForegroundColor Yellow
    docker-compose build --no-cache
    Write-Host "✓ Build completed" -ForegroundColor Green
}

# Load environment variables from .env file
Write-Host "Loading environment configuration..." -ForegroundColor Yellow
if (Test-Path "config\.env") {
    Get-Content "config\.env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "✓ Environment variables loaded" -ForegroundColor Green
}
else {
    Write-Host "⚠ No .env file found, using defaults" -ForegroundColor Yellow
}

# Start services
Write-Host "Starting enhanced Docker Compose stack..." -ForegroundColor Yellow
try {
    if ($Detached) {
        docker-compose up -d
    }
    else {
        docker-compose up
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ All services started successfully" -ForegroundColor Green
    }
    else {
        throw "Docker Compose failed with exit code $LASTEXITCODE"
    }
}
catch {
    Write-Host "✗ Failed to start services: $_" -ForegroundColor Red
    exit 1
}

if ($Detached) {
    Write-Host ""
    Write-Host "Enhanced Service Stack URLs:" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    Write-Host "  🌐 Main Interface (nginx):     http://localhost" -ForegroundColor White
    Write-Host "  📡 Ditto Gateway API:          http://localhost:8080" -ForegroundColor White
    Write-Host "  📚 Swagger UI (API Docs):      http://localhost:8082" -ForegroundColor White
    Write-Host "  🎛️  Ditto UI (Web Interface):   http://localhost:8083" -ForegroundColor White
    Write-Host "  🔧 Digital Twin App:           http://localhost:5000" -ForegroundColor White
    Write-Host "  🗄️  MongoDB Database:          mongodb://localhost:27017" -ForegroundColor White
    Write-Host "  📨 MQTT Broker:                mqtt://localhost:1883" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Service Management Commands:" -ForegroundColor Yellow
    Write-Host "============================" -ForegroundColor Yellow
    Write-Host "  View logs:      docker-compose logs -f [service_name]" -ForegroundColor White
    Write-Host "  Check status:   docker-compose ps" -ForegroundColor White
    Write-Host "  Stop services:  docker-compose down" -ForegroundColor White
    Write-Host "  Restart:        docker-compose restart [service_name]" -ForegroundColor White
    
    # Wait for services to initialize
    Write-Host ""
    Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
    Write-Host "(This may take 2-3 minutes for all Ditto services to start)" -ForegroundColor Gray
    
    Start-Sleep -Seconds 15
    
    # Check service health
    Write-Host ""
    Write-Host "Service Health Status:" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    
    $services = @(
        @{Name="mongodb"; DisplayName="MongoDB Database"},
        @{Name="mqtt_broker"; DisplayName="MQTT Broker"},
        @{Name="ditto-policies"; DisplayName="Ditto Policies"},
        @{Name="ditto-things"; DisplayName="Ditto Things"},
        @{Name="ditto-things-search"; DisplayName="Ditto Things Search"},
        @{Name="ditto-connectivity"; DisplayName="Ditto Connectivity"},
        @{Name="ditto-gateway"; DisplayName="Ditto Gateway"},
        @{Name="digital_twin_app"; DisplayName="Digital Twin App"}
    )
    
    foreach ($service in $services) {
        $containerId = docker-compose ps -q $service.Name 2>$null
        if ($containerId) {
            $health = docker inspect $containerId --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}running{{end}}' 2>$null
            $status = docker inspect $containerId --format='{{.State.Status}}' 2>$null
            
            if ($health -eq "healthy" -or ($health -eq "running" -and $status -eq "running")) {
                Write-Host "  ✓ $($service.DisplayName)" -ForegroundColor Green
            }
            elseif ($health -eq "starting" -or $status -eq "starting") {
                Write-Host "  ⏳ $($service.DisplayName) (starting...)" -ForegroundColor Yellow
            }
            else {
                Write-Host "  ⚠ $($service.DisplayName) ($health/$status)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "  ✗ $($service.DisplayName) (not found)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "🎉 Digital Twin Infrastructure is ready!" -ForegroundColor Green
    Write-Host "Visit http://localhost for the main interface" -ForegroundColor Cyan
}

# Show logs if requested
if ($Logs) {
    Write-Host ""
    Write-Host "Showing service logs (Ctrl+C to exit):" -ForegroundColor Yellow
    docker-compose logs -f
}