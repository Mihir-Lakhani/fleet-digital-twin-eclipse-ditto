# Digital Twin Platform - Working Endpoints
===============================================

This file contains all the working endpoints for your Digital Twin platform. Click on any link to access the service directly.

## 🚀 **MAIN PLATFORM ENDPOINTS**

### **Digital Twin API (Enhanced Flask Proxy)**
- **Main API Base**: [http://localhost:5000](http://localhost:5000)
- **Platform Health**: [http://localhost:5000/](http://localhost:5000/)
- **Service Connections**: [http://localhost:5000/test-connections](http://localhost:5000/test-connections)
- **API Documentation**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **API Status**: [http://localhost:5000/api/status](http://localhost:5000/api/status)
- **OpenAPI Specification**: [http://localhost:5000/api/openapi.json](http://localhost:5000/api/openapi.json)

## 🏗️ **MONGODB THING MANAGEMENT API** ⭐ **RECOMMENDED**

### **Direct MongoDB Endpoints (Port 5000)**
- **List All Things**: [http://localhost:5000/mongodb/things](http://localhost:5000/mongodb/things)
- **Create Thing**: `POST http://localhost:5000/mongodb/things`
- **Get Thing by ID**: `GET http://localhost:5000/mongodb/things/{thingId}`
- **Update Thing**: `PATCH http://localhost:5000/mongodb/things/{thingId}`
- **Replace Thing**: `PUT http://localhost:5000/mongodb/things/{thingId}`
- **Delete Thing**: `DELETE http://localhost:5000/mongodb/things/{thingId}`

### **Root-Level Convenience Endpoints**
- **List Things**: [http://localhost:5000/things](http://localhost:5000/things)
- **Create Thing**: `POST http://localhost:5000/things`
- **Get Thing**: `GET http://localhost:5000/things/{thingId}`
- **Update Thing**: `PATCH http://localhost:5000/things/{thingId}`
- **Delete Thing**: `DELETE http://localhost:5000/things/{thingId}`

## 📚 **WEB INTERFACES**

### **API Documentation & Testing**
- **Swagger UI**: [http://localhost:8082](http://localhost:8082) - Interactive API documentation
- **Ditto UI**: [http://localhost:8083](http://localhost:8083) - Eclipse Ditto web interface

## 🔧 **BACKEND SERVICES** (Internal Access Only)

### **Database & Messaging**
- **MongoDB**: `mongodb://localhost:27017/digitaltwindb` (Direct database access)
- **MQTT Broker**: 
  - Standard MQTT: `mqtt://localhost:1883`
  - WebSocket MQTT: `ws://localhost:9001`

### **Eclipse Ditto Services** (Internal Network Only)
- **Ditto Gateway**: `http://ditto-gateway:8080` (Container network only)
- **Ditto Things**: `http://ditto-things:8080` (Container network only)
- **Ditto Policies**: `http://ditto-policies:8080` (Container network only)

## ⚠️ **NON-WORKING ENDPOINTS** (Known Limitations)

### **External Ditto Gateway** ❌
- **Ditto Gateway HTTP**: [http://localhost:8080](http://localhost:8080) - *Blocked by clustering constraints*
- **Ditto API**: `http://localhost:8080/api/2/things` - *Returns ERR_EMPTY_RESPONSE*

**Why it doesn't work**: Eclipse Ditto Gateway requires minimum 2 contact points for cluster formation before starting external HTTP API. Internal communication works fine.

## 🛠️ **TESTING & DEMO SCRIPTS**

### **Python Scripts**
```bash
# Run the comprehensive demo
python scripts/demo_thing_management.py

# Test connections
python scripts/test_connections.py

# Data ingestion script
python scripts/data_ingest.py
```

### **PowerShell Scripts**
```powershell
# Run PowerShell demo
.\scripts\demo_thing_management.ps1

# Start enhanced Docker setup
.\scripts\start_docker_enhanced.ps1
```

## 📋 **QUICK API TESTING**

### **Create a Digital Twin (PowerShell)**
```powershell
$thingData = @{
    thingId = "vehicle:my_car_001"
    attributes = @{ 
        manufacturer = "Tesla"
        model = "Model S" 
        year = 2024
    }
    features = @{ 
        battery = @{ 
            properties = @{ level = 95.8 } 
        } 
    }
}

Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things" -Method POST -Body ($thingData | ConvertTo-Json -Depth 10) -ContentType "application/json"
```

### **List All Digital Twins**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things" -Method GET
```

### **Get Specific Digital Twin**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things/vehicle%3Amy_car_001" -Method GET
```

### **Delete Digital Twin**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things/vehicle%3Amy_car_001" -Method DELETE
```

## 🎯 **RECOMMENDED WORKFLOW**

1. **Start Platform**: `docker-compose -f docker-compose-final.yaml up -d`
2. **Check Health**: [http://localhost:5000/test-connections](http://localhost:5000/test-connections)
3. **View API Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
4. **Run Demo**: `python scripts/demo_thing_management.py`
5. **Create Things**: Use MongoDB endpoints (`/mongodb/things`)
6. **Monitor**: Use Swagger UI at [http://localhost:8082](http://localhost:8082)

## 📖 **DOCUMENTATION**

- **Quick Reference**: [`docs/QUICK_REFERENCE.md`](docs/QUICK_REFERENCE.md)
- **Complete Guide**: [`docs/MONGODB_THING_MANAGEMENT.md`](docs/MONGODB_THING_MANAGEMENT.md)
- **Architecture**: [`docs/ACTUAL_ARCHITECTURE.md`](docs/ACTUAL_ARCHITECTURE.md)
- **Issue Analysis**: [`docs/COMPLETE_ISSUE_ANALYSIS.md`](docs/COMPLETE_ISSUE_ANALYSIS.md)

## 🏆 **PLATFORM STATUS**

✅ **Fully Operational (95%)**:
- MongoDB Thing Management API
- Flask Enhanced Proxy
- Health monitoring
- Service connectivity
- CORS support
- API documentation

⚠️ **Known Constraints (5%)**:
- Eclipse Ditto external HTTP API blocked by clustering requirements
- Workaround: Use MongoDB Thing Management endpoints instead

---

**Last Updated**: September 25, 2025  
**Platform Version**: 2.0.0  
**Configuration**: docker-compose-final.yaml