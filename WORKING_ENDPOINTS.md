# Digital Twin API - Working Endpoints
===============================================

This file contains all the working API endpoints for your Digital Twin platform. Use these endpoints to interact with the system programmatically.

## 🚀 **MAIN API ENDPOINTS**

### **Digital Twin API (Flask REST API)**
- **Main API Base**: [http://localhost:5000](http://localhost:5000)
- **Platform Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Service Connections**: [http://localhost:5000/test-connections](http://localhost:5000/test-connections)
- **API Status**: [http://localhost:5000/api/status](http://localhost:5000/api/status)

## 🏗️ **MONGODB THING MANAGEMENT API** ⭐ **PRIMARY API**

### **CRUD Operations for Digital Twins**
- **List All Things**: `GET http://localhost:5000/mongodb/things`
- **Create Thing**: `POST http://localhost:5000/mongodb/things`
- **Get Thing by ID**: `GET http://localhost:5000/mongodb/things/{thingId}`
- **Update Thing (Full)**: `PUT http://localhost:5000/mongodb/things/{thingId}`
- **Update Thing (Partial)**: `PATCH http://localhost:5000/mongodb/things/{thingId}`
- **Delete Thing**: `DELETE http://localhost:5000/mongodb/things/{thingId}`

### **Example API Calls**

**PowerShell Examples:**
```powershell
# List all things
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things" -Method GET

# Create a new thing
$thing = @{
    thingId = "vehicle:truck001"
    attributes = @{
        manufacturer = "Volvo"
        model = "FH16"
        location = @{ latitude = 59.3293; longitude = 18.0686 }
    }
}
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things" -Method POST -Body ($thing | ConvertTo-Json -Depth 3) -ContentType "application/json"

# Get specific thing
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things/vehicle:truck001" -Method GET

# Delete thing
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things/vehicle:truck001" -Method DELETE
```

**cURL Examples:**
```bash
# List all things
curl http://localhost:5000/mongodb/things

# Create a new thing
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

# Get specific thing
curl http://localhost:5000/mongodb/things/sensor:temp001

# Update thing (partial)
curl -X PATCH http://localhost:5000/mongodb/things/sensor:temp001 \
  -H "Content-Type: application/json" \
  -d '{"attributes": {"temperature": 25.5}}'

# Delete thing
curl -X DELETE http://localhost:5000/mongodb/things/sensor:temp001
```

## 🔧 **BACKEND SERVICES** (Internal Access Only)

### **Database & Messaging**
- **MongoDB**: `mongodb://localhost:27017/digitaltwindb` (Direct database access)
- **MQTT Broker**: 
  - Standard MQTT: `mqtt://localhost:1883`
  - WebSocket MQTT: `ws://localhost:9001`

### **Eclipse Ditto Services** (Container Network Only)
- **Ditto Gateway**: `http://ditto-gateway:8080` (Internal API gateway)
- **Ditto Things**: `http://ditto-things:8080` (Internal service)
- **Ditto Policies**: `http://ditto-policies:8080` (Internal service)

## 📊 **MONITORING & DEBUGGING**

### **Health Check Endpoints**
- **API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Service Connectivity**: [http://localhost:5000/test-connections](http://localhost:5000/test-connections)

### **Service Status Commands**
```powershell
# Check Docker services
docker-compose -f docker-compose-final.yaml ps

# View API logs
docker-compose -f docker-compose-final.yaml logs -f app

# Test MongoDB connection
docker exec -it mongodb mongosh digitaltwindb
```

## 🔐 **API AUTHENTICATION & HEADERS**

### **CORS Support**
All API endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, Accept`

### **Content Type**
For POST, PUT, and PATCH requests:
```
Content-Type: application/json
```

### **Request/Response Format**
All API endpoints accept and return JSON format.

**Success Response:**
```json
{
  "success": true,
  "thingId": "vehicle:truck001",
  "message": "Thing created successfully",
  "created": "2025-09-26T10:30:00Z"
}
```

**Error Response:**
```json
{
  "error": "Thing not found",
  "status": "not_found"
}
```

## 🚀 **GETTING STARTED**

1. **Start Services:**
   ```powershell
   docker-compose -f docker-compose-final.yaml up -d
   ```

2. **Test API:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
   ```

3. **Test Connectivity:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:5000/test-connections" -Method GET
   ```

4. **Create Your First Thing:**
   ```powershell
   $thing = @{ thingId = "test:001"; attributes = @{ name = "Test Device" } }
   Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things" -Method POST -Body ($thing | ConvertTo-Json) -ContentType "application/json"
   ```

---

**System Status**: ✅ All API endpoints operational  
**Configuration**: docker-compose-final.yaml  
**Documentation**: See README.md for detailed setup instructions