# Quick Reference Guide - Fleet Digital Twin

## Essential Commands

### Docker Operations
```bash
# Start all services
docker-compose -f docker-compose-standalone.yaml up -d

# Stop all services  
docker-compose down

# View running containers
docker ps

# View logs
docker logs <container_name>

# Restart service
docker restart <container_name>

# Clean up
docker system prune -a
```

### API Quick Test
```bash
# Health check
curl http://localhost:5000/api/health

# List digital twins
curl http://localhost:5000/mongodb/things

# Create twin
curl -X POST http://localhost:5000/mongodb/things \
  -H "Content-Type: application/json" \
  -d '{"thingId":"test:001","attributes":{"name":"Test"}}'

# Delete twin
curl -X DELETE http://localhost:5000/mongodb/things/test:001
```

### Python Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start API
cd src && python app.py
```

### Frontend Operations
```bash
# Install dependencies
cd frontend && npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

---

## Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| API Health | http://localhost:5000/api/health | Service status |
| Digital Twins | http://localhost:5000/mongodb/things | CRUD operations |
| Test Connections | http://localhost:5000/test-connections | Service connectivity |
| React Frontend | http://localhost:3000 | Web interface |
| MongoDB | mongodb://localhost:27017 | Database direct access |
| MQTT Broker | localhost:1883 | IoT messaging |
| MQTT WebSocket | ws://localhost:9001 | Web MQTT |

---

## Common Issues & Solutions

### Port Conflicts
```bash
# Find process using port
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /f /pid <PID>

# Kill process (macOS/Linux)  
kill -9 <PID>
```

### Docker Issues
```bash
# Reset Docker
docker system prune -a -f
docker-compose down -v
docker-compose up -d

# Check container health
docker inspect <container_name>
```

### Database Issues
```bash
# Connect to MongoDB
docker exec -it mongodb mongosh digitaltwindb

# Check collections
db.things.count()
db.things.find().limit(5)

# Reset database
docker volume rm digital_twin_mongodb_data
```

---

## Key File Locations

### Configuration
- **Main Config**: `config/config.yaml`
- **Environment**: `config/.env`
- **Docker Compose**: `docker-compose-standalone.yaml`
- **MQTT Config**: `config/mosquitto.conf`

### Source Code
- **Backend API**: `src/app.py`
- **Device Models**: `src/device_model.py`
- **Communication**: `src/communication.py`
- **Frontend**: `frontend/src/`

### Documentation
- **Complete Guide**: `COMPLETE_PROJECT_DOCUMENTATION.md`
- **API Docs**: `docs/API_DOCUMENTATION.md`
- **Installation**: `docs/INSTALLATION_GUIDE.md`
- **Arduino Guide**: `README_ARDUINO.md`

### Scripts & Tools
- **Live Monitor**: `live_horn_monitor.py`
- **Arduino Controller**: `arduino_buzzer_controller.py`
- **Test Scripts**: `test_api_simple.py`, `tests/`

---

## Digital Twin Data Structure

### Basic Twin
```json
{
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
          "activationCount": 56
        }
      }
    }
  }
}
```

### Twin Types
- `Vehicle` - Cars, trucks, motorcycles
- `Sensor` - Temperature, pressure, motion sensors  
- `Device` - Generic IoT devices
- `Building` - Structures and facilities
- `Machine` - Industrial equipment
- `System` - Software/logical systems

### Twin Status
- `active` - Operational and responsive
- `inactive` - Not currently active
- `maintenance` - Under maintenance
- `error` - Experiencing issues

---

## MongoDB Queries

### Useful Database Queries
```javascript
// Connect to database
use digitaltwindb

// Count all twins
db.things.count()

// Find by type
db.things.find({"attributes.type": "Vehicle"})

// Find active twins
db.things.find({"attributes.status": "active"})

// Find twins with features
db.things.find({"features": {$exists: true}})

// Update twin status
db.things.updateOne(
  {"thingId": "car:horn-car-001"}, 
  {$set: {"attributes.status": "maintenance"}}
)

// Get horn activation count
db.things.find(
  {"thingId": "car:horn-car-001"}, 
  {"features.horn.properties.status.activationCount": 1}
)
```

---

## MQTT Topics

### Standard Topic Structure
```
fleet/devices/{deviceId}/status     # Device status updates
fleet/devices/{deviceId}/commands   # Send commands to device
fleet/twins/{twinId}/state         # Twin state changes
fleet/events/{eventType}           # System events
```

### Example Messages
```bash
# Publish horn activation
mosquitto_pub -h localhost -t "fleet/devices/car001/commands" \
  -m '{"command":"activate_horn","duration":3000}'

# Subscribe to status updates  
mosquitto_sub -h localhost -t "fleet/devices/+/status"
```

---

## Environment Variables

### Essential Settings
```bash
# API Configuration
APP_PORT=5000
FLASK_ENV=development

# Database 
DATABASE_URL=mongodb://localhost:27017/digitaltwindb

# MQTT
MQTT_BROKER_URL=tcp://localhost:1883

# Frontend
REACT_APP_API_URL=http://localhost:5000
```

---

## Arduino Integration

### Hardware Setup
- **Arduino Uno** connected via USB
- **Buzzer** on pin 8
- **LED** on pin 13 (built-in)
- **Optional LCD** via I2C (SDA=A4, SCL=A5)

### Serial Commands
```
'1' = Horn ON
'0' = Horn OFF  
'?' = Status query
```

### Test Connection
```python
import serial
ser = serial.Serial('COM3', 9600, timeout=1)
ser.write(b'1')  # Activate horn
response = ser.readline()
print(response)
```

---

## Performance Monitoring

### System Health
```bash
# Docker resource usage
docker stats

# API response time
time curl http://localhost:5000/mongodb/things

# Database performance
docker exec -it mongodb mongosh digitaltwindb \
  --eval "db.things.explain('executionStats').find()"
```

### Live Monitoring
```bash
# Start live horn monitor
python live_horn_monitor.py

# Monitor API logs
tail -f logs/app.log

# Monitor all containers
docker-compose logs -f
```

---

## Development Shortcuts

### Quick Start Development
```bash
# One-command setup
git clone <repo> && cd <repo> && \
docker-compose up -d && \
python -m venv .venv && .venv\Scripts\activate && \
pip install -r requirements.txt && \
cd src && python app.py
```

### Code Quality
```bash
# Format Python code
black src/
isort src/

# Lint frontend
cd frontend && npm run lint

# Run tests
pytest tests/
npm test
```

### Database Reset
```bash
# Complete reset
docker-compose down -v
docker volume prune -f
docker-compose up -d
python scripts/init_database.py
```

---

## Troubleshooting Checklist

### Service Not Starting
- [ ] Docker Desktop running
- [ ] Ports not in use (5000, 27017, 1883)
- [ ] Virtual environment activated
- [ ] Dependencies installed
- [ ] Configuration files present

### API Not Responding
- [ ] Flask app started (`python src/app.py`)
- [ ] MongoDB container running
- [ ] Network connectivity
- [ ] Firewall/antivirus not blocking

### Frontend Issues
- [ ] Node.js installed (v18+)
- [ ] Dependencies installed (`npm install`)
- [ ] API URL configured correctly
- [ ] Backend API running

### Arduino Issues
- [ ] Arduino IDE installed
- [ ] Correct COM port selected
- [ ] Firmware uploaded
- [ ] Serial monitor at 9600 baud
- [ ] Driver installed

---

## Support Resources

### Documentation
- [Complete Documentation](COMPLETE_PROJECT_DOCUMENTATION.md)
- [API Reference](docs/API_DOCUMENTATION.md)
- [Installation Guide](docs/INSTALLATION_GUIDE.md)
- [Arduino Setup](README_ARDUINO.md)

### Community
- [GitHub Repository](https://github.com/Mihir-Lakhani/fleet-digital-twin-eclipse-ditto)
- [Issues & Bug Reports](https://github.com/Mihir-Lakhani/fleet-digital-twin-eclipse-ditto/issues)
- [Discussions](https://github.com/Mihir-Lakhani/fleet-digital-twin-eclipse-ditto/discussions)

### External Resources
- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Arduino Reference](https://www.arduino.cc/reference/)

---

**Last Updated**: October 5, 2025  
**Version**: 1.0.0
curl http://localhost:5000/mongodb/things
```

### Get Thing
```bash
curl http://localhost:5000/mongodb/things/sensor:quick001
```

### Update Temperature
```bash
curl -X PATCH http://localhost:5000/mongodb/things/sensor:quick001 \
  -H "Content-Type: application/json" \
  -d '{"features":{"temperature":{"properties":{"value":25.0}}}}'
```

### Delete Thing
```bash
curl -X DELETE http://localhost:5000/mongodb/things/sensor:quick001
```

## JavaScript Quick Examples

### Create Thing
```javascript
fetch('http://localhost:5000/mongodb/things', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    thingId: "device:js001",
    attributes: {name: "Smart Device"},
    features: {status: {properties: {online: true}}}
  })
}).then(r => r.json()).then(console.log);
```

### List Things
```javascript
fetch('http://localhost:5000/mongodb/things')
  .then(r => r.json())
  .then(data => console.log(`Found ${data.count} things`));
```

### Update Thing
```javascript
fetch('http://localhost:5000/mongodb/things/device:js001', {
  method: 'PATCH',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    features: {status: {properties: {online: false, last_seen: new Date().toISOString()}}}
  })
});
```

## Python Quick Examples

### Create Thing
```python
import requests

data = {
    "thingId": "sensor:py001",
    "attributes": {"location": "Lab"},
    "features": {"temperature": {"properties": {"value": 22.0}}}
}

response = requests.post('http://localhost:5000/mongodb/things', json=data)
print(f"Created: {response.json()['thingId']}")
```

### List Things
```python
response = requests.get('http://localhost:5000/mongodb/things')
data = response.json()
print(f"Total things: {data['count']}")
for thing in data['things']:
    print(f"- {thing['thingId']}")
```

### Update Thing
```python
update = {"features": {"temperature": {"properties": {"value": 24.5}}}}
response = requests.patch('http://localhost:5000/mongodb/things/sensor:py001', json=update)
print(f"Updated: {response.status_code == 204}")
```

## Common Thing Schema

### Minimal Thing
```json
{"thingId": "namespace:id"}
```

### Vehicle Thing
```json
{
  "thingId": "vehicle:001",
  "attributes": {
    "manufacturer": "Tesla",
    "model": "Model 3",
    "year": 2024
  },
  "features": {
    "gps": {
      "properties": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "speed": 45.0
      }
    },
    "engine": {
      "properties": {
        "running": true,
        "battery_level": 85.2
      }
    }
  }
}
```

### Sensor Thing
```json
{
  "thingId": "sensor:001",
  "attributes": {
    "location": "Building A",
    "floor": 3,
    "room": "301"
  },
  "features": {
    "temperature": {
      "properties": {
        "value": 23.5,
        "unit": "celsius"
      }
    },
    "humidity": {
      "properties": {
        "value": 45.2,
        "unit": "percent"
      }
    }
  }
}
```

## Response Codes
- **201 Created** - Thing created successfully
- **200 OK** - Thing retrieved successfully
- **204 No Content** - Thing updated/deleted successfully
- **404 Not Found** - Thing doesn't exist
- **409 Conflict** - Thing already exists (POST only)
- **400 Bad Request** - Invalid data
- **503 Service Unavailable** - Database connection issue

## API Documentation
- **Full Docs**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/test-connections`