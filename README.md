# Fleet Digital Twin with Eclipse Ditto

A comprehensive digital twin solution for fleet management using Eclipse Ditto, MQTT, and MongoDB.

## 🏗️ Project Structure

```
├── src/                    # Source code files
│   ├── app.py             # Flask web application entry point
│   ├── communication.py   # IoT device communication logic
│   └── device_model.py    # Digital twin device classes/models
├── config/                # Configuration files
│   ├── .env              # Environment variables
│   ├── config.yaml       # Static configuration settings
│   └── mosquitto.conf    # MQTT broker configuration
├── data/                  # Datasets, mock data, or logs
│   ├── sample_input.json # Mock device data
│   └── logs/             # Runtime logs directory
├── docs/                  # Documentation files
│   ├── architecture.md   # System architecture documentation
│   ├── api_specs.md     # API specifications
│   └── user_guide.md    # Usage documentation
├── tests/                 # Test scripts
│   ├── unit_test_app.py  # Unit tests for main app
│   └── integration_tests.py # End-to-end/integration tests
├── scripts/               # Utility and automation scripts
│   ├── start_docker.ps1  # PowerShell script to start Docker services
│   ├── test_connections.py # Connection testing utility
│   ├── start_services.sh # Shell script for service startup
│   ├── deploy.sh         # Deployment automation script
│   └── data_ingest.py    # Data ingestion utility
├── docker-compose.yaml   # Docker Compose configuration
├── Dockerfile            # Application container definition
├── requirements.txt      # Python dependencies
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- Docker Desktop (running)
- Python 3.13+
- Git

### Quick Start

1. **Clone the repository** (if not already done)
2. **Start Docker Desktop** and wait for it to fully initialize
3. **Run the startup script**:
   ```powershell
   .\scripts\start_docker.ps1
   ```

### Manual Setup

If you prefer manual setup:

1. **Set environment variables**:
   ```powershell
   $env:APP_PORT="5000"
   $env:ECLIPSE_DITTO_API_URL="http://ditto-gateway:8080/api/2"
   $env:ECLIPSE_DITTO_API_KEY="ditto_api"
   $env:MQTT_BROKER_URL="tcp://mqtt_broker:1883"
   $env:MQTT_BROKER_USER="mqtt_user"
   $env:MQTT_BROKER_PASSWORD="mqtt_password"
   $env:DATABASE_URL="mongodb://mongodb:27017/digitaltwindb"
   ```

2. **Start services**:
   ```bash
   docker-compose up -d
   ```

3. **Wait for services to initialize** (about 30 seconds)

## 🔧 Services

The application consists of the following services:

| Service | Description | Port | Status |
|---------|-------------|------|--------|
| **Digital Twin App** | Flask web application | 5000 | ✅ Running |
| **Swagger UI** | Interactive API documentation | 8082 | ✅ Available |
| **Ditto UI** | Web interface for digital twins | 8083 | ✅ Available |
| **MongoDB** | Database for data storage | 27017 | ✅ Running |
| **MQTT Broker** | Eclipse Mosquitto message broker | 1883, 9001 | ✅ Running |
| **Ditto Gateway** | Eclipse Ditto API gateway | 8080 | ✅ Running |
| **Ditto Policies** | Policy management service | - | ✅ Running |
| **Ditto Things** | Thing management service | - | ✅ Running |

## 🌐 Endpoints

### Web Application
- **Main App**: http://localhost:5000
- **Health Check**: http://localhost:5000/
- **Connection Test**: http://localhost:5000/test-connections

### User Interfaces  
- **Swagger UI**: http://localhost:8082 - Interactive API documentation
- **Ditto UI**: http://localhost:8083 - Web interface for managing digital twins

### External Services
- **MongoDB**: localhost:27017
- **MQTT Broker**: localhost:1883
- **Eclipse Ditto API**: http://localhost:8080/api/2

### 🔐 UI Service Authentication

**Swagger UI** (Port 8082):
- No authentication required
- Displays comprehensive API documentation for Digital Twin services
- Interactive testing interface for all endpoints

**Ditto UI** (Port 8083):
- Default credentials: Username `ditto`, Password `ditto`  
- Web interface for creating and managing digital twin "things"
- Real-time monitoring of device states and policies

### 🚦 Service Management

**Start All Services (including UI services):**
```powershell
# Full stack with web interfaces
docker-compose -f docker-compose-final.yaml up -d

# Check service status
docker-compose -f docker-compose-final.yaml ps
```

**Start Core Services Only:**
```powershell
# Start without UI services (original configuration)
docker-compose -f docker-compose-final.yaml up -d mongodb mqtt_broker ditto-policies ditto-things ditto-gateway app
```

**Stop Services:**
```powershell
# Stop all services
docker-compose -f docker-compose-final.yaml down

# Stop and remove volumes (⚠️ removes all data)
docker-compose -f docker-compose-final.yaml down -v
```

**Individual Service Management:**
```powershell
# Start only UI services
docker-compose -f docker-compose-final.yaml up -d swagger-ui ditto-ui

# View logs for specific service
docker-compose -f docker-compose-final.yaml logs -f swagger-ui
```

### 🛡️ Security Recommendations

**For Development Environment:**
- Default credentials are used (username: `ditto`, password: `ditto`)
- UI services are accessible without authentication
- Use only in isolated development environments

**For Production Deployment:**
- Change all default passwords in `.env` file
- Enable proper authentication on all services
- Use reverse proxy with SSL/TLS termination
- Restrict network access with firewall rules
- Regular security updates for all Docker images
- Consider disabling UI services in production environments

## 🧪 Testing

### Run Integration Tests
```bash
python -m pytest tests/integration_tests.py -v
```

### Test Service Connections
```bash
python scripts/test_connections.py
```

### Manual Connection Testing
```bash
# Test individual services
python src/communication.py
```

## 📊 Current Status

✅ **Working Services:**
- MongoDB: Fully operational
- MQTT Broker: Fully operational  
- Flask Application: Fully operational
- Docker Networking: All containers can communicate
- Integration Tests: All passing (6/6)

⚠️ **Known Issues:**
- Eclipse Ditto cluster discovery warnings (services still functional)
- External connections use localhost, internal use container names

## 🔧 Configuration

### Environment Variables (.env)
```bash
ECLIPSE_DITTO_API_URL=http://ditto-gateway:8080/api/2
ECLIPSE_DITTO_API_KEY=ditto_api
MQTT_BROKER_URL=tcp://mqtt_broker:1883
MQTT_BROKER_USER=mqtt_user
MQTT_BROKER_PASSWORD=mqtt_password
DATABASE_URL=mongodb://mongodb:27017/digitaltwindb
APP_PORT=5000
```

### Static Configuration (config.yaml)
```yaml
service_name: fleet_vehicle_digital_twin
retry_attempts: 3
connection_timeout: 5000
logging_level: INFO
device_types:
  sensor: gps
  actuator: engine_switch
```

## 🛠️ Development

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Run Tests
```bash
pytest tests/ -v
```

### View Logs
```bash
# View all service logs
docker-compose logs

# View specific service logs
docker logs <container_name>
```

## 📝 Next Steps

1. **Implement Device Models**: Add digital twin device classes
2. **Create API Endpoints**: Build REST APIs for device management
3. **Add Authentication**: Implement proper authentication for Ditto
4. **Data Processing**: Add real-time data processing capabilities
5. **Monitoring**: Add service monitoring and alerting

## 🎉 Success!

Your digital twin infrastructure is now running and ready for development! All core services are operational and communicating properly through the Docker network.

Access your application at: **http://localhost:5000**