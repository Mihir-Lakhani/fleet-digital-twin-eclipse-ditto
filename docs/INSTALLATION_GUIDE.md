# Installation & Setup Guide - Fleet Digital Twin

## Prerequisites

Before installing the Fleet Digital Twin platform, ensure you have the following prerequisites installed on your system.

### Required Software

#### 1. Docker Desktop
- **Windows**: Download from [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-setup/)
- **macOS**: Download from [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- **Linux**: Install Docker Engine and Docker Compose

**Verification**:
```bash
docker --version
docker-compose --version
```

#### 2. Node.js (v18 or higher)
- Download from [Node.js official website](https://nodejs.org/)
- Includes npm package manager

**Verification**:
```bash
node --version
npm --version
```

#### 3. Python (v3.13 or higher)
- **Windows**: Download from [Python.org](https://www.python.org/downloads/)
- **macOS**: Use Homebrew: `brew install python3`
- **Linux**: Use package manager: `sudo apt install python3 python3-pip`

**Verification**:
```bash
python --version
pip --version
```

#### 4. Git
- Download from [Git official website](https://git-scm.com/downloads)

**Verification**:
```bash
git --version
```

### Optional Software

#### Arduino IDE (for IoT integration)
- Download from [Arduino official website](https://www.arduino.cc/en/software)
- Required for hardware integration features

#### MongoDB Compass (for database management)
- Download from [MongoDB Compass](https://www.mongodb.com/products/compass)
- GUI tool for MongoDB database management

---

## Installation Methods

### Method 1: Quick Start (Recommended)

This method gets you up and running quickly with minimal configuration.

#### Step 1: Clone Repository
```bash
# Clone the repository
git clone https://github.com/Mihir-Lakhani/fleet-digital-twin-eclipse-ditto.git

# Navigate to project directory
cd fleet-digital-twin-eclipse-ditto
```

#### Step 2: Start Services with Docker
```bash
# Start all services using Docker Compose
docker-compose -f docker-compose-standalone.yaml up -d

# Wait for services to initialize (30-60 seconds)
# Check if services are running
docker ps
```

#### Step 3: Start Backend API
```bash
# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start Flask API
cd src
python app.py
```

#### Step 4: Verify Installation
```bash
# Test API health
curl http://localhost:5000/api/health

# Test MongoDB connection
curl http://localhost:5000/mongodb/things

# Expected response: JSON array of digital twins
```

### Method 2: Development Setup

This method is for developers who want to modify the code and contribute to the project.

#### Step 1: Clone and Setup Repository
```bash
# Clone with all branches
git clone --recursive https://github.com/Mihir-Lakhani/fleet-digital-twin-eclipse-ditto.git
cd fleet-digital-twin-eclipse-ditto

# Create development branch
git checkout -b development
```

#### Step 2: Backend Development Setup
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies including development tools
pip install -r requirements.txt
pip install -r requirements-dev.txt  # If exists

# Install pre-commit hooks (optional)
pip install pre-commit
pre-commit install
```

#### Step 3: Frontend Development Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start development server (optional)
npm start
```

#### Step 4: Database Setup
```bash
# Start only MongoDB for development
docker run -d --name mongodb-dev -p 27017:27017 mongo:7.0

# Or use Docker Compose for specific services
docker-compose -f docker-compose-standalone.yaml up -d mongodb mqtt_broker
```

### Method 3: Production Deployment

This method is for production deployments with proper security and scaling considerations.

#### Step 1: Environment Configuration
```bash
# Create production environment file
cp config/.env.example config/.env

# Edit environment variables
nano config/.env
```

#### Step 2: Security Configuration
```bash
# Generate secure secrets
openssl rand -hex 32  # For JWT secret
openssl rand -hex 16  # For API keys

# Update docker-compose-production.yaml with secrets
```

#### Step 3: Production Deployment
```bash
# Deploy with production configuration
docker-compose -f docker-compose-production.yaml up -d

# Setup reverse proxy (nginx)
docker-compose -f docker-compose-nginx.yaml up -d

# Configure SSL certificates (Let's Encrypt)
certbot --nginx -d your-domain.com
```

---

## Configuration

### Environment Variables

#### Backend Configuration (`.env`)
```bash
# API Configuration
APP_PORT=5000
FLASK_ENV=production
FLASK_DEBUG=false
SECRET_KEY=your-secret-key-here

# Database Configuration
DATABASE_URL=mongodb://mongodb:27017/digitaltwindb
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_DB=digitaltwindb
MONGO_USERNAME=admin
MONGO_PASSWORD=secure-password

# MQTT Configuration
MQTT_BROKER_URL=tcp://mqtt_broker:1883
MQTT_BROKER_USER=mqtt_user
MQTT_BROKER_PASSWORD=mqtt_secure_password
MQTT_CLIENT_ID=fleet_api_client

# Security Configuration
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRES=3600
API_RATE_LIMIT=100
CORS_ORIGINS=http://localhost:3000,https://your-domain.com

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_MQTT=true
ENABLE_REAL_TIME=true
```

#### Frontend Configuration
```bash
# Create .env file in frontend directory
REACT_APP_API_URL=http://localhost:5000
REACT_APP_MQTT_WS_URL=ws://localhost:9001
REACT_APP_ENVIRONMENT=development
REACT_APP_APP_NAME=Fleet Digital Twin
REACT_APP_VERSION=1.0.0
```

### Docker Configuration

#### Development Docker Compose
```yaml
# docker-compose-dev.yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb-dev
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: digitaltwindb
    volumes:
      - mongodb_dev_data:/data/db
      - ./scripts/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    
  mqtt_broker:
    image: eclipse-mosquitto:2.0
    container_name: mqtt-dev
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./config/mosquitto-dev.conf:/mosquitto/config/mosquitto.conf
      - mosquitto_dev_data:/mosquitto/data

volumes:
  mongodb_dev_data:
  mosquitto_dev_data:
```

### Service Configuration

#### MongoDB Configuration
```javascript
// scripts/init-mongo.js
db = db.getSiblingDB('digitaltwindb');

// Create collections
db.createCollection('things');
db.createCollection('events');
db.createCollection('users');

// Create indexes for performance
db.things.createIndex({ "thingId": 1 }, { unique: true });
db.things.createIndex({ "attributes.type": 1 });
db.things.createIndex({ "attributes.status": 1 });
db.things.createIndex({ "_modified": -1 });

// Insert sample data
db.things.insertOne({
  "thingId": "car:horn-car-001",
  "attributes": {
    "name": "Car Horn Digital Twin",
    "type": "Vehicle",
    "status": "active"
  },
  "features": {
    "horn": {
      "properties": {
        "status": {
          "state": "OFF",
          "activationCount": 0
        }
      }
    }
  },
  "_modified": new Date()
});

print("Database initialized successfully");
```

#### MQTT Broker Configuration
```conf
# config/mosquitto.conf
# Basic configuration
listener 1883
listener 9001
protocol websockets

# Authentication (for production)
allow_anonymous false
password_file /mosquitto/config/passwd

# Logging
log_dest file /mosquitto/log/mosquitto.log
log_type error
log_type warning
log_type notice
log_type information
log_timestamp true

# Persistence
persistence true
persistence_location /mosquitto/data/

# Security
max_connections 1000
max_inflight_messages 100
```

---

## Post-Installation Setup

### Database Initialization

#### Option 1: Automatic Initialization
```bash
# Run initialization script
python scripts/init_database.py

# Verify initialization
python scripts/verify_setup.py
```

#### Option 2: Manual Initialization
```bash
# Connect to MongoDB
docker exec -it mongodb mongosh digitaltwindb

# Create sample digital twin
db.things.insertOne({
  "thingId": "vehicle:sample-001",
  "attributes": {
    "name": "Sample Vehicle",
    "type": "Vehicle",
    "status": "active"
  }
});

# Verify insertion
db.things.count();
```

### Arduino Setup (Optional)

#### Hardware Setup
1. Connect Arduino Uno via USB
2. Install Arduino IDE
3. Install required libraries:
   - `LiquidCrystal_I2C` (for LCD display)

#### Upload Firmware
```bash
# Open Arduino IDE
# File → Open → arduino_horn_controller.ino
# Tools → Board → Arduino Uno
# Tools → Port → Select your Arduino port
# Upload
```

#### Test Arduino Connection
```python
# Run Arduino controller GUI
python arduino_buzzer_controller.py

# Or test programmatically
python -c "
import serial
ser = serial.Serial('COM3', 9600, timeout=1)  # Adjust COM port
ser.write(b'1')  # Turn on horn
ser.close()
"
```

### Frontend Build (Production)

#### Build React Application
```bash
cd frontend

# Install dependencies
npm ci --production

# Build for production
npm run build

# Serve with nginx or serve
npm install -g serve
serve -s build -l 3000
```

### SSL/TLS Setup (Production)

#### Using Let's Encrypt
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Using Custom Certificates
```bash
# Generate self-signed certificate (development)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configure nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

---

## Verification & Testing

### System Health Check
```bash
# Run comprehensive health check
python scripts/health_check.py

# Expected output:
# ✅ MongoDB: Connected
# ✅ MQTT Broker: Connected  
# ✅ Flask API: Running
# ✅ Frontend: Built
# ✅ Arduino: Connected (if available)
```

### API Testing
```bash
# Test basic endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/mongodb/things
curl http://localhost:5000/test-connections

# Create test twin
curl -X POST http://localhost:5000/mongodb/things \
  -H "Content-Type: application/json" \
  -d '{"thingId":"test:install-verification","attributes":{"name":"Installation Test"}}'

# Verify creation
curl http://localhost:5000/mongodb/things/test:install-verification

# Clean up
curl -X DELETE http://localhost:5000/mongodb/things/test:install-verification
```

### Performance Testing
```bash
# Install testing tools
pip install locust

# Run load test
locust -f tests/load_test.py --host=http://localhost:5000
```

### Frontend Testing
```bash
cd frontend

# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e

# Check build
npm run build
```

---

## Troubleshooting Installation

### Common Issues

#### 1. Docker Permission Errors
**Problem**: Permission denied when running Docker commands
**Solution**:
```bash
# Linux: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Windows: Run PowerShell as Administrator
# macOS: Check Docker Desktop settings
```

#### 2. Port Conflicts
**Problem**: Port already in use errors
**Solution**:
```bash
# Find process using port
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # macOS/Linux

# Kill process
taskkill /f /pid <PID>        # Windows
kill -9 <PID>                 # macOS/Linux

# Change port in configuration
export APP_PORT=5001
```

#### 3. MongoDB Connection Issues
**Problem**: Cannot connect to MongoDB
**Solution**:
```bash
# Check MongoDB status
docker logs mongodb

# Restart MongoDB
docker restart mongodb

# Check network connectivity
docker network ls
docker network inspect digital_twin_network
```

#### 4. Python Virtual Environment Issues
**Problem**: Cannot activate virtual environment
**Solution**:
```bash
# Windows: Check execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Recreate virtual environment
rm -rf .venv
python -m venv .venv
```

#### 5. Node.js Module Installation Errors
**Problem**: npm install fails
**Solution**:
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use yarn instead
npm install -g yarn
yarn install
```

### Log Locations

#### Application Logs
```bash
# Flask API logs
tail -f logs/app.log

# Docker container logs
docker logs digital_twin_app
docker logs mongodb
docker logs mqtt_broker

# Frontend development logs
# Check browser console and terminal output
```

#### System Logs
```bash
# Windows Event Viewer
# eventvwr.msc

# Linux system logs
journalctl -u docker
tail -f /var/log/syslog

# macOS Console app
# Applications → Utilities → Console
```

### Getting Help

#### Community Support
- **GitHub Issues**: [Report bugs and request features](https://github.com/Mihir-Lakhani/fleet-digital-twin-eclipse-ditto/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/Mihir-Lakhani/fleet-digital-twin-eclipse-ditto/discussions)

#### Documentation
- **API Documentation**: `docs/API_DOCUMENTATION.md`
- **Architecture Guide**: `docs/ACTUAL_ARCHITECTURE.md`
- **Arduino Setup**: `README_ARDUINO.md`

#### Contact
- **LinkedIn**: [Mihir Lakhani](https://linkedin.com/in/mihir-lakhani)
- **Email**: Contact through GitHub

---

## Next Steps

After successful installation:

1. **Explore the API**: Use the provided endpoints to create and manage digital twins
2. **Start the Frontend**: Launch the React web interface for visual management
3. **Connect Arduino**: Set up hardware integration for real-world testing
4. **Monitor System**: Use the live monitor for real-time status updates
5. **Customize**: Modify configuration and add new features as needed

### Recommended Learning Path
1. **Basic Usage**: Create, read, update, delete digital twins via API
2. **Frontend Interaction**: Use the web interface for twin management
3. **IoT Integration**: Connect Arduino devices for hardware control
4. **Real-time Monitoring**: Observe live system status and metrics
5. **Advanced Features**: Explore MQTT messaging and analytics
6. **Custom Development**: Extend the platform with new features

---

This installation guide provides comprehensive instructions for getting the Fleet Digital Twin platform up and running in various environments. Follow the appropriate method based on your use case and technical requirements.