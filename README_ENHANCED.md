# Digital Twin Infrastructure - Enhanced Stack

A comprehensive Digital Twin project using Eclipse Ditto, MQTT, MongoDB, and Docker. This infrastructure provides a complete ecosystem for IoT device management, real-time communication, and web-based interfaces.

## 🚀 Enhanced Features

### Complete Service Stack (11 Services)
- **🌐 Nginx Reverse Proxy** - Unified entry point on port 80
- **📡 Eclipse Ditto Complete Stack** - All microservices (policies, things, search, connectivity, gateway)  
- **🎛️ Ditto Web UI** - Modern web interface for thing management
- **📚 Swagger UI** - Interactive API documentation
- **🔧 Custom Flask App** - Digital twin application with health monitoring
- **🗄️ MongoDB** - Persistent data storage with health checks
- **📨 MQTT Broker** - Real-time messaging with Eclipse Mosquitto

### Key Capabilities
- **Web-Based Management**: Complete Ditto UI accessible at http://localhost
- **API Documentation**: Interactive Swagger UI at http://localhost/docs
- **Reverse Proxy**: All services accessible through nginx on port 80
- **Health Monitoring**: Comprehensive health checks for all services
- **Service Discovery**: Proper Docker networking and dependencies
- **Production Ready**: Full logging, monitoring, and error handling

## 🏗️ Project Structure

```
├── src/                    # Source code files
│   ├── app.py             # Flask web application entry point
│   ├── communication.py   # IoT device communication logic
│   └── device_model.py    # Digital twin device classes/models
├── config/                # Configuration files
│   ├── .env              # Enhanced environment variables
│   ├── config.yaml       # Static configuration settings
│   ├── mosquitto.conf    # MQTT broker configuration
│   └── nginx.conf        # Nginx reverse proxy configuration
├── scripts/               # Utility and automation scripts
│   ├── start_docker_enhanced.ps1  # Enhanced startup script
│   └── start_docker.ps1          # Original startup script
├── tests/                 # Test scripts
│   ├── enhanced_integration_tests.py # Comprehensive test suite
│   └── integration_tests.py          # Original tests
├── docs/                  # Documentation files
│   ├── ENHANCED_STACK_GUIDE.md      # Complete setup guide
│   ├── architecture.md              # System architecture
│   └── user_guide.md               # Usage documentation
├── docker-compose.yaml   # Enhanced Docker Compose with 11 services
├── Dockerfile            # Application container definition
├── requirements.txt      # Python dependencies
└── README.md             # This file
```

## 📋 Quick Start

### Prerequisites
- Docker Desktop for Windows
- Python 3.13+ (automatically configured)
- PowerShell (for enhanced scripts)

### 🚀 One-Command Setup

```powershell
# Start the complete enhanced stack
.\scripts\start_docker_enhanced.ps1
```

**That's it!** The enhanced startup script will:
- ✅ Check Docker availability
- ✅ Load environment configuration  
- ✅ Start all 11 services with health monitoring
- ✅ Display real-time service status
- ✅ Provide access URLs and management commands

### Enhanced Startup Options

```powershell
# Basic startup (detached mode)
.\scripts\start_docker_enhanced.ps1

# With build (rebuild all images)
.\scripts\start_docker_enhanced.ps1 -Build

# Clean start (removes volumes and containers)
.\scripts\start_docker_enhanced.ps1 -Clean

# With real-time logs
.\scripts\start_docker_enhanced.ps1 -Logs
```

## 🌐 Service URLs

### Primary Access (via Nginx Reverse Proxy)
| Service | URL | Description |
|---------|-----|-------------|
| **🏠 Main Interface** | http://localhost | Ditto Web UI (primary entry point) |
| **📡 API Access** | http://localhost/api/ | Ditto REST API with CORS |
| **📚 API Documentation** | http://localhost/docs/ | Interactive Swagger UI |
| **🔧 Custom App** | http://localhost/app/ | Digital Twin Application |
| **💚 Health Check** | http://localhost/health | System health monitor |

### Direct Service Access
| Service | URL | Purpose |
|---------|-----|---------|
| Ditto Gateway | http://localhost:8080 | Direct API access |
| Swagger UI | http://localhost:8082 | API documentation interface |
| Ditto Web UI | http://localhost:8083 | Thing management UI |
| Digital Twin App | http://localhost:5000 | Custom application |
| MongoDB | mongodb://localhost:27017 | Database access |
| MQTT Broker | mqtt://localhost:1883 | Message broker |

## 🔧 Enhanced Service Stack

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

## 🧪 Testing & Validation

### Enhanced Integration Tests

Run the comprehensive test suite:

```bash
# Run all enhanced tests
python -m pytest tests/enhanced_integration_tests.py -v

# Run original tests  
python -m pytest tests/integration_tests.py -v

# Test specific components
python -m pytest tests/enhanced_integration_tests.py::TestEnhancedIntegration -v
```

### Manual Testing

```bash
# Test nginx reverse proxy
curl http://localhost/health

# Test Ditto API through nginx
curl http://localhost/api/2/status

# Test individual services
curl http://localhost:8080/health    # Ditto Gateway
curl http://localhost:8082/          # Swagger UI  
curl http://localhost:8083/          # Ditto UI
curl http://localhost:5000/          # Digital Twin App
```

## 🛠️ Development Commands

### Service Management
```bash
# Check all service status
docker-compose ps

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f [service_name]

# Restart specific service
docker-compose restart [service_name]

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Health Monitoring
```bash
# Check service health
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"

# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Test service connectivity
docker-compose exec nginx wget -qO- http://localhost/health
```

## 🔧 Configuration

### Environment Variables
The enhanced `.env` file includes comprehensive configuration:

```env
# Core Services
ECLIPSE_DITTO_API_URL=http://ditto-gateway:8080/api/2
MQTT_BROKER_URL=tcp://mqtt_broker:1883
DATABASE_URL=mongodb://mongodb:27017/digitaltwindb

# External Access URLs
NGINX_EXTERNAL_URL=http://localhost
DITTO_GATEWAY_EXTERNAL_URL=http://localhost:8080
SWAGGER_UI_EXTERNAL_URL=http://localhost:8082
DITTO_UI_EXTERNAL_URL=http://localhost:8083

# UI Configuration
DITTO_UI_USERNAME=ditto
DITTO_UI_PASSWORD=ditto
```

### Service Dependencies
All services include proper dependency management and health checks:
- **MongoDB** starts first (database foundation)
- **MQTT Broker** starts in parallel (message infrastructure)
- **Ditto Services** start in dependency order (policies → things → search/connectivity → gateway)
- **UI Services** start after Ditto Gateway is healthy
- **Nginx** starts last (reverse proxy for all services)

## 📚 Documentation

- **[Enhanced Stack Guide](docs/ENHANCED_STACK_GUIDE.md)** - Comprehensive setup and configuration
- **[Architecture Documentation](docs/architecture.md)** - System design and components
- **[User Guide](docs/user_guide.md)** - Usage instructions and examples

## 🚀 Production Deployment

### Security Considerations
- Change default Ditto credentials (ditto/ditto)
- Enable MongoDB authentication
- Configure MQTT broker authentication
- Implement HTTPS with SSL certificates
- Set up proper firewall rules

### Scaling & Monitoring
- Add Prometheus/Grafana for monitoring
- Implement horizontal scaling for Ditto services
- Configure log aggregation
- Set up backup strategies for MongoDB

## 🎯 What's New in Enhanced Stack

### ✨ New Services
- **Nginx Reverse Proxy**: Unified entry point on port 80
- **Complete Ditto Stack**: All 5 Ditto microservices
- **Ditto Web UI**: Modern interface for thing management
- **Swagger UI**: Interactive API documentation

### 🔧 Enhanced Features
- **Health Checks**: Comprehensive monitoring for all services
- **Service Dependencies**: Proper startup order and dependency management
- **Enhanced Logging**: Detailed logs and monitoring capabilities
- **Production Ready**: Security headers, CORS, and error handling

### 📈 Improved Testing
- **16 Enhanced Tests**: Comprehensive validation of all services
- **Service Dependency Testing**: Validates startup order and connectivity
- **Environment Configuration Testing**: Ensures proper configuration
- **Cross-Service Communication**: Tests service interaction

---

🎉 **The enhanced Digital Twin Infrastructure is now ready for production use!**

For detailed setup instructions, see the [Enhanced Stack Guide](docs/ENHANCED_STACK_GUIDE.md).