# Fleet Digital Twin API with Eclipse Ditto

A comprehensive digital twin API solution for fleet management using Eclipse Ditto, MQTT, and MongoDB. This is a pure API-based implementation without web UI components.

## 🏗️ Project Structure

```
├── src/                    # Source code files
│   ├── app.py             # Flask API application entry point
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

The application consists of the following backend services:

| Service | Description | Port | Status |
|---------|-------------|------|--------|
| **Digital Twin API** | Flask REST API application | 5000 | ✅ Running |
| **MongoDB** | Database for data storage | 27017 | ✅ Running |
| **MQTT Broker** | Eclipse Mosquitto message broker | 1883, 9001 | ✅ Running |
| **Ditto Gateway** | Eclipse Ditto API gateway | 8080 | ✅ Running |
| **Ditto Policies** | Policy management service | - | ✅ Running |
| **Ditto Things** | Thing management service | - | ✅ Running |

## 🌐 API Endpoints

### Core API
- **API Root**: http://localhost:5000/
- **Health Check**: http://localhost:5000/api/health
- **Connection Test**: http://localhost:5000/test-connections
- **API Status**: http://localhost:5000/api/status

### MongoDB Thing Management API
- **List Things**: `GET http://localhost:5000/mongodb/things`
- **Create Thing**: `POST http://localhost:5000/mongodb/things`
- **Get Thing**: `GET http://localhost:5000/mongodb/things/{thingId}`
- **Update Thing**: `PUT http://localhost:5000/mongodb/things/{thingId}`
- **Patch Thing**: `PATCH http://localhost:5000/mongodb/things/{thingId}`
- **Delete Thing**: `DELETE http://localhost:5000/mongodb/things/{thingId}`

### External Services
- **MongoDB**: localhost:27017
- **MQTT Broker**: localhost:1883
- **Eclipse Ditto API**: http://localhost:8080/api/2

## 🛠️ API Usage Examples

### PowerShell Examples

**Test API Health:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
```

**Test Service Connections:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/test-connections" -Method Get
```

**Create a Digital Twin:**
```powershell
$thing = @{
    thingId = "vehicle:truck001"
    attributes = @{
        manufacturer = "Volvo"
        model = "FH16"
        location = @{
            latitude = 59.3293
            longitude = 18.0686
        }
    }
}

Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things" -Method Post -Body ($thing | ConvertTo-Json -Depth 3) -ContentType "application/json"
```

**List All Things:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things" -Method Get
```

**Get Specific Thing:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things/vehicle:truck001" -Method Get
```

**Delete Thing:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things/vehicle:truck001" -Method Delete
```

### cURL Examples

**Test API Health:**
```bash
curl http://localhost:5000/api/health
```

**Create a Digital Twin:**
```bash
curl -X POST http://localhost:5000/mongodb/things \
  -H "Content-Type: application/json" \
  -d '{
    "thingId": "sensor:temp001",
    "attributes": {
      "type": "temperature",
      "location": "warehouse-a",
      "unit": "celsius"
    }
  }'
```

**List All Things:**
```bash
curl http://localhost:5000/mongodb/things
```

## ✅ CORS Support & Cross-Origin Access

**✅ CORS ENABLED**: The Digital Twin API supports Cross-Origin Resource Sharing (CORS) for web application integration.

### CORS Configuration
- **Flask-CORS**: Enabled for all endpoints with wildcard origins (`*`)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Response Headers**: Includes `Access-Control-Allow-Origin: *`

### Testing CORS
```powershell
# Test CORS-enabled endpoint
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET

# Response should include: Access-Control-Allow-Origin: *
```

### Production Security
⚠️ **For production deployments**: Replace wildcard (`*`) origins with specific domains:
```python
CORS(app, resources={
    r"/*": {
        "origins": ["https://yourdomain.com", "https://admin.yourdomain.com"]
    }
})
```

## 🚦 Service Management

**Start All Services:**
```powershell
# Full stack with all backend services
docker-compose -f docker-compose-final.yaml up -d

# Check service status
docker-compose -f docker-compose-final.yaml ps
```

**Start Core Services Only:**
```powershell
# Start minimal set (API, MongoDB, MQTT)
docker-compose -f docker-compose-final.yaml up -d mongodb mqtt_broker app
```

**Stop Services:**
```powershell
# Stop all services
docker-compose -f docker-compose-final.yaml down

# Stop and remove volumes (⚠️ removes all data)
docker-compose -f docker-compose-final.yaml down -v
```

**View Logs:**
```powershell
# View API logs
docker-compose -f docker-compose-final.yaml logs -f app

# View all service logs
docker-compose -f docker-compose-final.yaml logs -f
```

## 🔍 Monitoring & Debugging

**Check Service Health:**
```powershell
# Test all service connections
Invoke-RestMethod -Uri "http://localhost:5000/test-connections" -Method Get
```

**MongoDB Direct Access:**
```bash
# Connect to MongoDB shell
docker exec -it mongodb mongosh digitaltwindb

# View things collection
db.things.find().pretty()
```

**MQTT Testing:**
```bash
# Subscribe to MQTT messages
docker exec -it mqtt_broker mosquitto_sub -t "sensors/+/data"

# Publish test message
docker exec -it mqtt_broker mosquitto_pub -t "sensors/test/data" -m '{"temperature": 25.5}'
```

## 📊 Data Models

### Thing Schema
```json
{
  "thingId": "string (required)",
  "attributes": {
    "manufacturer": "string",
    "model": "string",
    "location": {
      "latitude": "number",
      "longitude": "number"
    },
    "custom_field": "any"
  },
  "_created": "ISO8601 timestamp",
  "_modified": "ISO8601 timestamp"
}
```

### API Response Format
```json
{
  "success": true,
  "thingId": "vehicle:truck001",
  "message": "Thing created successfully",
  "created": "2025-09-26T10:30:00Z"
}
```

## 🛡️ Security Recommendations

**For Development Environment:**
- CORS is open for development ease
- Use only in isolated development environments

**For Production Deployment:**
- Configure specific CORS origins
- Enable proper authentication on all services
- Use reverse proxy with SSL/TLS termination
- Restrict network access with firewall rules
- Regular security updates for all Docker images
- Environment variable security management

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the config directory:

```env
# API Configuration
APP_PORT=5000
FLASK_ENV=development

# Eclipse Ditto Configuration
ECLIPSE_DITTO_API_URL=http://ditto-gateway:8080/api/2
ECLIPSE_DITTO_API_KEY=ditto_api

# MongoDB Configuration
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=digitaltwindb

# MQTT Configuration
MQTT_BROKER_URL=tcp://mqtt_broker:1883
MQTT_BROKER_USER=mqtt_user
MQTT_BROKER_PASSWORD=mqtt_password
```

## 📝 API Documentation

For detailed API documentation including request/response schemas, error codes, and additional examples, see:

- `docs/MONGODB_THING_MANAGEMENT.md` - Complete MongoDB API guide
- `docs/QUICK_REFERENCE.md` - Quick reference with examples
- `WORKING_ENDPOINTS.md` - All available endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Access your API at: **http://localhost:5000**