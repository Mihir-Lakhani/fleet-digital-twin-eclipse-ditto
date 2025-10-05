# API Documentation - Fleet Digital Twin

## Overview
This document provides comprehensive API documentation for the Fleet Digital Twin platform.

## Base URL
```
http://localhost:5000
```

## Authentication
Currently in development mode with no authentication required. Production deployments should implement JWT-based authentication.

---

## Endpoints

### Health & Status

#### Get API Health
```http
GET /api/health
```

**Description**: Check the health status of the API service.

**Response**:
```json
{
  "service": "Digital Twin Fleet App",
  "status": "running",
  "version": "1.0.0",
  "timestamp": "2025-10-05T10:30:00Z"
}
```

#### Test Connections
```http
GET /test-connections
```

**Description**: Test connectivity to all backend services (MongoDB, MQTT).

**Response**:
```json
{
  "mongodb": {
    "status": "connected",
    "host": "localhost:27017",
    "database": "digitaltwindb"
  },
  "mqtt": {
    "status": "connected",
    "broker": "localhost:1883"
  }
}
```

---

### Digital Twin Management

#### List All Digital Twins
```http
GET /mongodb/things
```

**Description**: Retrieve all digital twins from the database.

**Query Parameters**:
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Number of results to skip (default: 0)
- `type` (optional): Filter by twin type
- `status` (optional): Filter by status (active, inactive, maintenance, error)

**Response**:
```json
[
  {
    "thingId": "car:horn-car-001",
    "attributes": {
      "name": "Car Horn Digital Twin",
      "type": "Vehicle",
      "status": "active",
      "description": "Digital twin for car horn functionality",
      "version": "1.0.0",
      "location": {
        "address": "123 Main St, City, State",
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "metadata": {
        "manufacturer": "Tesla",
        "model": "Model 3",
        "serialNumber": "TM3-001",
        "lastModified": "2025-10-01T19:45:05.123Z",
        "createdAt": "2025-09-15T10:30:00.000Z"
      }
    },
    "features": {
      "horn": {
        "definition": ["com.example:Horn:1.0.0"],
        "properties": {
          "status": {
            "state": "OFF",
            "activationCount": 56,
            "lastActivated": "2025-10-01T19:45:00.999087Z"
          },
          "configuration": {
            "enabled": true,
            "volume": "normal",
            "pattern": "continuous",
            "maxDuration": 5000
          },
          "hardware": {
            "type": "buzzer",
            "pin": "digital",
            "voltage": "5V",
            "frequency": "2000Hz"
          }
        }
      }
    },
    "_modified": "2025-10-01T19:45:05.123Z"
  }
]
```

#### Get Specific Digital Twin
```http
GET /mongodb/things/{thingId}
```

**Description**: Retrieve a specific digital twin by its ID.

**Path Parameters**:
- `thingId` (required): Unique identifier for the digital twin

**Response**:
```json
{
  "thingId": "car:horn-car-001",
  "attributes": { /* ... */ },
  "features": { /* ... */ }
}
```

**Error Responses**:
```json
{
  "error": "Thing not found",
  "thingId": "invalid-id",
  "statusCode": 404
}
```

#### Create Digital Twin
```http
POST /mongodb/things
```

**Description**: Create a new digital twin.

**Request Body**:
```json
{
  "thingId": "vehicle:truck001",
  "attributes": {
    "name": "Fleet Truck 001",
    "type": "Vehicle",
    "status": "active",
    "description": "Long-haul delivery truck",
    "version": "1.0.0",
    "location": {
      "address": "789 Highway Ave, City, State",
      "latitude": 41.8781,
      "longitude": -87.6298
    },
    "metadata": {
      "manufacturer": "Volvo",
      "model": "FH16",
      "serialNumber": "VLV-TRK-001",
      "yearManufactured": 2023
    }
  },
  "features": {
    "engine": {
      "definition": ["com.volvo:Engine:2.0.0"],
      "properties": {
        "status": {
          "running": false,
          "temperature": 20.5,
          "fuelLevel": 85.2
        },
        "configuration": {
          "autoShutoff": true,
          "idleTimeout": 300
        }
      }
    }
  }
}
```

**Response**:
```json
{
  "message": "Digital twin created successfully",
  "thingId": "vehicle:truck001",
  "statusCode": 201
}
```

#### Update Digital Twin
```http
PUT /mongodb/things/{thingId}
```

**Description**: Update an existing digital twin (full replacement).

**Path Parameters**:
- `thingId` (required): Unique identifier for the digital twin

**Request Body**:
```json
{
  "attributes": {
    "status": "maintenance",
    "location": {
      "address": "Service Center, City, State",
      "latitude": 40.7589,
      "longitude": -73.9851
    }
  },
  "features": {
    "engine": {
      "properties": {
        "status": {
          "running": false,
          "temperature": 15.0,
          "fuelLevel": 45.8
        }
      }
    }
  }
}
```

#### Partial Update Digital Twin
```http
PATCH /mongodb/things/{thingId}
```

**Description**: Partially update specific fields of a digital twin.

**Request Body**:
```json
{
  "attributes.status": "active",
  "features.horn.properties.status.state": "OFF"
}
```

#### Delete Digital Twin
```http
DELETE /mongodb/things/{thingId}
```

**Description**: Delete a digital twin permanently.

**Response**:
```json
{
  "message": "Digital twin deleted successfully",
  "thingId": "vehicle:truck001",
  "statusCode": 200
}
```

---

### Feature Management

#### Activate Feature
```http
POST /api/twins/{thingId}/activate/{featureName}
```

**Description**: Activate a specific feature of a digital twin.

**Path Parameters**:
- `thingId` (required): Digital twin identifier
- `featureName` (required): Name of the feature to activate

**Request Body** (optional):
```json
{
  "duration": 5000,
  "intensity": "high",
  "pattern": "continuous"
}
```

**Response**:
```json
{
  "message": "horn activated successfully",
  "thingId": "car:horn-car-001",
  "feature": "horn",
  "activationCount": 57,
  "timestamp": "2025-10-05T10:30:00Z"
}
```

#### Deactivate Feature
```http
POST /api/twins/{thingId}/deactivate/{featureName}
```

**Description**: Deactivate a specific feature of a digital twin.

#### Get Feature Status
```http
GET /api/twins/{thingId}/features/{featureName}
```

**Description**: Get the current status of a specific feature.

**Response**:
```json
{
  "featureName": "horn",
  "status": {
    "state": "OFF",
    "activationCount": 56,
    "lastActivated": "2025-10-01T19:45:00.999087Z"
  },
  "configuration": {
    "enabled": true,
    "volume": "normal",
    "maxDuration": 5000
  },
  "hardware": {
    "type": "buzzer",
    "frequency": "2000Hz"
  }
}
```

---

### Analytics & Reporting

#### Get System Analytics
```http
GET /api/analytics/twins
```

**Description**: Get aggregated analytics for all digital twins.

**Response**:
```json
{
  "analytics": [
    {
      "_id": "Vehicle",
      "count": 15,
      "active": 12,
      "inactive": 2,
      "maintenance": 1
    },
    {
      "_id": "Sensor",
      "count": 8,
      "active": 7,
      "inactive": 1,
      "maintenance": 0
    }
  ],
  "totalTwins": 23,
  "totalFeatureActivations": 1247,
  "lastUpdated": "2025-10-05T10:30:00Z"
}
```

#### Get Twin Activity Log
```http
GET /api/twins/{thingId}/activity
```

**Description**: Get activity history for a specific digital twin.

**Query Parameters**:
- `limit` (optional): Maximum number of entries (default: 50)
- `since` (optional): ISO timestamp to filter from

**Response**:
```json
{
  "thingId": "car:horn-car-001",
  "activities": [
    {
      "timestamp": "2025-10-05T10:25:00Z",
      "action": "feature_activated",
      "feature": "horn",
      "details": {
        "duration": 2000,
        "activationCount": 57
      }
    },
    {
      "timestamp": "2025-10-05T10:20:00Z",
      "action": "status_changed",
      "from": "inactive",
      "to": "active"
    }
  ],
  "totalEntries": 245
}
```

---

### MQTT Integration

#### Publish Message
```http
POST /api/mqtt/publish
```

**Description**: Publish a message to an MQTT topic.

**Request Body**:
```json
{
  "topic": "fleet/devices/car001/commands",
  "message": {
    "command": "activate_horn",
    "duration": 3000,
    "timestamp": "2025-10-05T10:30:00Z"
  },
  "qos": 1,
  "retain": false
}
```

#### Subscribe to Topic
```http
POST /api/mqtt/subscribe
```

**Description**: Subscribe to an MQTT topic for real-time updates.

**Request Body**:
```json
{
  "topic": "fleet/devices/+/status",
  "qos": 1,
  "callback_url": "http://your-app.com/webhook/mqtt"
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error description",
  "statusCode": 400,
  "timestamp": "2025-10-05T10:30:00Z",
  "path": "/mongodb/things/invalid-id",
  "details": {
    "field": "thingId",
    "message": "Invalid format"
  }
}
```

### HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

---

## Rate Limiting
- Default: 100 requests per minute per IP
- Authenticated users: 1000 requests per minute
- Headers returned:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1696524600
  ```

---

## WebSocket API

### Real-time Updates
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:5000/ws');

// Subscribe to twin updates
ws.send(JSON.stringify({
  action: 'subscribe',
  topic: 'twins.car:horn-car-001.features.horn'
}));

// Receive real-time updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Twin update:', data);
};
```

---

## SDK Examples

### Python SDK
```python
import requests

class FleetDigitalTwinAPI:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
    
    def get_twins(self):
        response = requests.get(f"{self.base_url}/mongodb/things")
        return response.json()
    
    def activate_feature(self, thing_id, feature_name):
        response = requests.post(
            f"{self.base_url}/api/twins/{thing_id}/activate/{feature_name}"
        )
        return response.json()

# Usage
api = FleetDigitalTwinAPI()
twins = api.get_twins()
result = api.activate_feature("car:horn-car-001", "horn")
```

### JavaScript SDK
```javascript
class FleetDigitalTwinAPI {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }
  
  async getTwins() {
    const response = await fetch(`${this.baseUrl}/mongodb/things`);
    return response.json();
  }
  
  async activateFeature(thingId, featureName) {
    const response = await fetch(
      `${this.baseUrl}/api/twins/${thingId}/activate/${featureName}`,
      { method: 'POST' }
    );
    return response.json();
  }
}

// Usage
const api = new FleetDigitalTwinAPI();
const twins = await api.getTwins();
const result = await api.activateFeature('car:horn-car-001', 'horn');
```

---

## Testing with cURL

### Basic Operations
```bash
# Health check
curl http://localhost:5000/api/health

# List twins
curl http://localhost:5000/mongodb/things

# Get specific twin
curl http://localhost:5000/mongodb/things/car:horn-car-001

# Create twin
curl -X POST http://localhost:5000/mongodb/things \
  -H "Content-Type: application/json" \
  -d '{"thingId":"test:001","attributes":{"name":"Test Twin","type":"Device"}}'

# Update twin
curl -X PUT http://localhost:5000/mongodb/things/test:001 \
  -H "Content-Type: application/json" \
  -d '{"attributes":{"status":"active"}}'

# Delete twin
curl -X DELETE http://localhost:5000/mongodb/things/test:001

# Activate feature
curl -X POST http://localhost:5000/api/twins/car:horn-car-001/activate/horn
```

### Advanced Testing
```bash
# Test with authentication (when implemented)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/mongodb/things

# Bulk operations
curl -X POST http://localhost:5000/api/twins/bulk \
  -H "Content-Type: application/json" \
  -d '{"action":"activate","twins":["car:001","car:002"],"feature":"horn"}'

# Analytics
curl http://localhost:5000/api/analytics/twins?timeframe=24h
```

---

This API documentation provides comprehensive coverage of all available endpoints, request/response formats, and usage examples for the Fleet Digital Twin platform.