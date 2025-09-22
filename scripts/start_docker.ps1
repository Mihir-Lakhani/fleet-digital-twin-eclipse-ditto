# PowerShell script to start Docker Desktop and Digital Twin services

Write-Host "Digital Twin Docker Stack Startup Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if Docker Desktop is running
Write-Host "Checking Docker Desktop status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✓ Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Desktop is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop manually and wait for it to fully initialize." -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
$env:APP_PORT = "5000"
$env:ECLIPSE_DITTO_API_URL = "http://ditto:8080/api/2"
$env:ECLIPSE_DITTO_API_KEY = "ditto_api"
$env:MQTT_BROKER_URL = "tcp://mqtt_broker:1883"
$env:MQTT_BROKER_USER = "mqtt_user"
$env:MQTT_BROKER_PASSWORD = "mqtt_password"
$env:DATABASE_URL = "mongodb://mongodb:27017/digitaltwindb"

Write-Host "✓ Environment variables set" -ForegroundColor Green

# Start Docker Compose services
Write-Host "Starting Docker Compose services..." -ForegroundColor Yellow
docker-compose down --remove-orphans
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker services started successfully" -ForegroundColor Green
    
    Write-Host "Waiting 30 seconds for services to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    Write-Host "Checking service status..." -ForegroundColor Yellow
    docker-compose ps
    
    Write-Host ""
    Write-Host "Services should now be accessible at:" -ForegroundColor Green
    Write-Host "  - Digital Twin App: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "  - Eclipse Ditto: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "  - MQTT Broker: localhost:1883" -ForegroundColor Cyan
    Write-Host "  - MongoDB: localhost:27017" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "To test connections, run:" -ForegroundColor Yellow
    Write-Host "  python src/communication.py" -ForegroundColor White
    
} else {
    Write-Host "✗ Failed to start Docker services" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
}