# Digital Twin Infrastructure - Enhanced Stack Guide

## Overview

This document provides comprehensive instructions for the enhanced Digital Twin infrastructure that includes the complete Eclipse Ditto ecosystem with web interfaces, API documentation, and reverse proxy capabilities.

## Enhanced Architecture

### Service Stack (11 Services)

| Service | Container | Port | Purpose | Health Check |
|---------|-----------|------|---------|--------------|
| **Nginx** | nginx | 80 | Reverse proxy & main entry point | ✅ |
| **MongoDB** | mongodb | 27017 | Database persistence | ✅ |
| **MQTT Broker** | mqtt_broker | 1883, 9001 | Message broker | ✅ |
| **Ditto Policies** | ditto-policies | - | Policy management | ✅ |
| **Ditto Things** | ditto-things | - | Thing management | ✅ |
| **Ditto Things Search** | ditto-things-search | - | Search capabilities | ✅ |
| **Ditto Connectivity** | ditto-connectivity | - | Connection management | ✅ |
| **Ditto Gateway** | ditto-gateway | 8080 | API gateway | ✅ |
| **Swagger UI** | swagger-ui | 8082 | API documentation | ✅ |
| **Ditto UI** | ditto-ui | 8083 | Web interface | ✅ |
| **Digital Twin App** | digital_twin_app | 5000 | Custom application | ✅ |

### Service URLs

#### Public Access (through Nginx - Port 80)
- **Main Interface**: http://localhost (Ditto UI)
- **API Access**: http://localhost/api/ (Ditto API)
- **API Documentation**: http://localhost/docs/ (Swagger UI)
- **Application**: http://localhost/app/ (Digital Twin App)
- **Health Check**: http://localhost/health

#### Direct Access
- **Ditto Gateway**: http://localhost:8080
- **Swagger UI**: http://localhost:8082
- **Ditto Web UI**: http://localhost:8083
- **Digital Twin App**: http://localhost:5000

## Quick Start

### 1. Enhanced Startup Script

Use the new enhanced PowerShell script:

```powershell
# Basic startup
.\scripts\start_docker_enhanced.ps1

# With build
.\scripts\start_docker_enhanced.ps1 -Build

# Clean start (removes volumes)
.\scripts\start_docker_enhanced.ps1 -Clean

# With logs
.\scripts\start_docker_enhanced.ps1 -Logs
```

### 2. Service Initialization

The enhanced stack takes 2-3 minutes to fully initialize all services. The startup script will show real-time health status.

### 3. Verification

#### Quick Health Check
```bash
# Check all services
docker-compose ps

# Check health status
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"
```

#### Service-Specific Tests
```bash
# Test nginx reverse proxy
curl http://localhost/health

# Test Ditto API
curl http://localhost/api/2/status

# Test individual services
curl http://localhost:8080/health    # Ditto Gateway
curl http://localhost:8082/          # Swagger UI  
curl http://localhost:8083/          # Ditto UI
curl http://localhost:5000/          # Digital Twin App
```

## Service Details

### Nginx Reverse Proxy
- **Purpose**: Central entry point with routing and load balancing
- **Configuration**: `config/nginx.conf`
- **Features**:
  - Security headers
  - CORS support for APIs
  - Gzip compression
  - Health monitoring
  - Request routing to all services

### Eclipse Ditto Complete Stack
- **ditto-policies**: Authorization and policy management
- **ditto-things**: Digital twin thing management
- **ditto-things-search**: Search and query capabilities
- **ditto-connectivity**: External system connections
- **ditto-gateway**: API gateway and authentication

### User Interface Components
- **Ditto UI**: Complete web interface for thing management
- **Swagger UI**: Interactive API documentation
- **Digital Twin App**: Custom Python Flask application

## Configuration

### Environment Variables
The enhanced `.env` file includes:

```env
# Core Services
ECLIPSE_DITTO_API_URL=http://ditto-gateway:8080/api/2
MQTT_BROKER_URL=tcp://mqtt_broker:1883
DATABASE_URL=mongodb://mongodb:27017/digitaltwindb

# External URLs
NGINX_EXTERNAL_URL=http://localhost
DITTO_GATEWAY_EXTERNAL_URL=http://localhost:8080
SWAGGER_UI_EXTERNAL_URL=http://localhost:8082
DITTO_UI_EXTERNAL_URL=http://localhost:8083

# UI Configuration
DITTO_UI_API_BASE_URL=http://ditto-gateway:8080/api/2
DITTO_UI_USERNAME=ditto
DITTO_UI_PASSWORD=ditto
```

### Health Checks
All services include comprehensive health checks:
- **Interval**: 30 seconds
- **Timeout**: 10 seconds  
- **Retries**: 3
- **Start Period**: Service-specific (10s-120s)

## Development Workflow

### 1. Service Management

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Restart specific service
docker-compose restart [service_name]

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### 2. Individual Service Access

```bash
# Access specific services directly
docker-compose exec mongodb mongosh
docker-compose exec nginx nginx -t
docker-compose exec ditto-gateway curl localhost:8080/health
```

### 3. Debugging

```bash
# Check service dependencies
docker-compose config

# Inspect service configuration
docker-compose ps
docker inspect [container_name]

# Monitor resource usage
docker stats

# View specific service logs
docker-compose logs [service_name]
```

## Testing

### Enhanced Integration Tests

Run the comprehensive test suite:

```bash
# All tests
python -m pytest tests/enhanced_integration_tests.py -v

# Specific test categories
python -m pytest tests/enhanced_integration_tests.py::TestEnhancedIntegration -v
python -m pytest tests/enhanced_integration_tests.py::TestServiceDependencies -v
python -m pytest tests/enhanced_integration_tests.py::TestEnvironmentConfiguration -v
```

### Manual Testing

#### 1. Web Interface Testing
- Visit http://localhost for Ditto UI
- Visit http://localhost:8082 for API documentation
- Visit http://localhost:5000 for custom app

#### 2. API Testing
```bash
# Test API through nginx
curl -X GET http://localhost/api/2/status

# Test direct API access
curl -X GET http://localhost:8080/api/2/status

# Test authentication
curl -X GET http://localhost:8080/api/2/things \
  -H "Authorization: Basic ZGl0dG86ZGl0dG8="
```

#### 3. MQTT Testing
```bash
# Publish test message
mosquitto_pub -h localhost -t test/topic -m "Hello Digital Twin"

# Subscribe to messages
mosquitto_sub -h localhost -t test/topic
```

## Troubleshooting

### Common Issues

#### 1. Services Not Starting
```bash
# Check Docker resources
docker system df
docker system prune -f

# Check service logs
docker-compose logs [service_name]
```

#### 2. Health Check Failures
```bash
# Check specific service health
docker inspect [container_name] --format='{{.State.Health.Status}}'

# View health check logs
docker inspect [container_name] --format='{{range .State.Health.Log}}{{.Output}}{{end}}'
```

#### 3. Network Connectivity
```bash
# Test network connectivity
docker-compose exec [service1] ping [service2]

# Check network configuration
docker network ls
docker network inspect digital_twin_network
```

#### 4. Port Conflicts
```bash
# Check port usage
netstat -an | findstr :80
netstat -an | findstr :8080
```

### Performance Optimization

#### 1. Resource Allocation
```yaml
# Add to docker-compose.yaml for memory-constrained environments
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

#### 2. Java Heap Tuning
Ditto services include: `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=80`

## Security Considerations

### 1. Default Credentials
**Change default passwords in production:**
- Ditto UI: ditto/ditto
- MongoDB: No authentication (enable for production)
- MQTT: Anonymous access (configure authentication)

### 2. Network Security
- Services communicate on isolated Docker network
- Nginx provides security headers
- CORS configured for API access

### 3. Production Hardening
```bash
# Enable MongoDB authentication
# Configure MQTT authentication
# Use HTTPS with SSL certificates
# Implement proper authentication for Ditto
# Configure firewall rules
```

## Monitoring and Logging

### 1. Service Monitoring
```bash
# Real-time service status
watch docker-compose ps

# Resource monitoring
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### 2. Log Management
```bash
# Centralized logging
docker-compose logs -f --tail=100

# Service-specific logs
docker-compose logs -f nginx
docker-compose logs -f ditto-gateway
```

### 3. Health Monitoring
The nginx health endpoint provides overall stack status:
```bash
curl http://localhost/health
```

## Next Steps

### 1. Production Deployment
- Configure HTTPS/SSL
- Implement authentication
- Set up monitoring (Prometheus/Grafana)
- Configure backup strategies

### 2. Development Extensions
- Add custom microservices
- Implement business logic
- Create custom UI components
- Integrate with external systems

### 3. Scaling
- Implement horizontal scaling
- Add load balancing
- Configure clustering
- Optimize for performance

---

For technical support or questions, refer to:
- [Eclipse Ditto Documentation](https://eclipse.org/ditto/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)