# MongoDB Thing Management System - Complete Guide

## Overview

This document provides comprehensive guidance for using the MongoDB-based Thing management system that bypasses the Eclipse Ditto clustering constraints. The system provides full CRUD operations for digital twins while maintaining Ditto-compatible schema for future migration.

## Table of Contents

1. [API Endpoints](#api-endpoints)
2. [Authentication & Headers](#authentication--headers)
3. [Thing Schema](#thing-schema)
4. [Create Things (POST)](#create-things-post)
5. [List Things (GET)](#list-things-get)
6. [Get Specific Thing (GET by ID)](#get-specific-thing-get-by-id)
7. [Update Things (PUT)](#update-things-put)
8. [Partial Update (PATCH)](#partial-update-patch)
9. [Delete Things (DELETE)](#delete-things-delete)
10. [Error Handling](#error-handling)
11. [PowerShell Examples](#powershell-examples)
12. [cURL Examples](#curl-examples)
13. [JavaScript/Browser Examples](#javascriptbrowser-examples)
14. [Python Examples](#python-examples)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/mongodb/things` | Create a new Thing |
| `GET` | `/mongodb/things` | List all Things |
| `GET` | `/mongodb/things/{thingId}` | Get specific Thing by ID |
| `PUT` | `/mongodb/things/{thingId}` | Update/create Thing (upsert) |
| `PATCH` | `/mongodb/things/{thingId}` | Partial update of Thing |
| `DELETE` | `/mongodb/things/{thingId}` | Delete Thing |
| `OPTIONS` | `/mongodb/things[/{thingId}]` | CORS preflight |

**Base URL**: `http://localhost:5000`

---

## Authentication & Headers

### Required Headers
```http
Content-Type: application/json
```

### CORS Support
All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With`

---

## Thing Schema

### Complete Thing Structure
```json
{
  "thingId": "namespace:identifier",
  "definition": "org.eclipse.ditto:device:1.0.0",
  "attributes": {
    "manufacturer": "Tesla",
    "model": "Model 3",
    "year": 2023,
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  },
  "features": {
    "gps": {
      "properties": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "speed": 45.5,
        "timestamp": "2025-09-24T22:25:00Z"
      }
    },
    "engine": {
      "properties": {
        "running": true,
        "battery_level": 85.2,
        "temperature": 68.5
      }
    }
  }
}
```

### Metadata Fields (Auto-generated)
```json
{
  "_created": "2025-09-24T22:25:00Z",
  "_modified": "2025-09-24T22:25:00Z",
  "_revision": 1
}
```

### Required Fields
- `thingId`: Unique identifier (format: `namespace:identifier`)

### Optional Fields
- `definition`: Thing type definition
- `attributes`: Thing metadata and properties
- `features`: Functional capabilities with properties

---

## Create Things (POST)

### Endpoint
```http
POST /mongodb/things
```

### Minimal Example
```json
{
  "thingId": "test:simple001"
}
```

### Vehicle Example
```json
{
  "thingId": "vehicle:fleet001",
  "definition": "org.eclipse.ditto:vehicle:1.0.0",
  "attributes": {
    "manufacturer": "Tesla",
    "model": "Model 3",
    "year": 2023,
    "vin": "5YJ3E1EA6KF123456",
    "owner": "Fleet Management Co",
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "address": "San Francisco, CA"
    }
  },
  "features": {
    "gps": {
      "properties": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "speed": 45.5,
        "heading": 180.0,
        "altitude": 52.0,
        "timestamp": "2025-09-24T22:25:00Z"
      }
    },
    "engine": {
      "properties": {
        "running": true,
        "battery_level": 85.2,
        "range_remaining": 245,
        "charging": false,
        "temperature": 68.5
      }
    },
    "security": {
      "properties": {
        "locked": true,
        "alarm_active": false,
        "last_unlock": "2025-09-24T20:15:00Z"
      }
    }
  }
}
```

### IoT Sensor Example
```json
{
  "thingId": "sensor:temp001",
  "definition": "org.eclipse.ditto:sensor:1.0.0",
  "attributes": {
    "location": "Office Building A",
    "floor": 3,
    "room": "301",
    "installed_date": "2025-01-15",
    "maintenance_interval": "quarterly"
  },
  "features": {
    "temperature": {
      "properties": {
        "value": 23.5,
        "unit": "celsius",
        "accuracy": 0.1,
        "timestamp": "2025-09-24T22:25:00Z"
      }
    },
    "humidity": {
      "properties": {
        "value": 45.2,
        "unit": "percent",
        "timestamp": "2025-09-24T22:25:00Z"
      }
    },
    "connectivity": {
      "properties": {
        "wifi_strength": -45,
        "battery_level": 78,
        "last_ping": "2025-09-24T22:24:55Z"
      }
    }
  }
}
```

### Response (201 Created)
```json
{
  "thingId": "vehicle:fleet001",
  "definition": "org.eclipse.ditto:vehicle:1.0.0",
  "attributes": {
    "manufacturer": "Tesla",
    "model": "Model 3",
    "year": 2023
  },
  "features": {
    "gps": {
      "properties": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "speed": 45.5
      }
    }
  },
  "_created": "2025-09-24T22:25:00Z",
  "_modified": "2025-09-24T22:25:00Z",
  "_revision": 1
}
```

---

## List Things (GET)

### Endpoint
```http
GET /mongodb/things
```

### Response (200 OK)
```json
{
  "things": [
    {
      "thingId": "vehicle:fleet001",
      "definition": "org.eclipse.ditto:vehicle:1.0.0",
      "attributes": {
        "manufacturer": "Tesla",
        "model": "Model 3"
      },
      "features": {
        "gps": {
          "properties": {
            "latitude": 37.7749,
            "longitude": -122.4194
          }
        }
      },
      "_created": "2025-09-24T22:25:00Z",
      "_modified": "2025-09-24T22:25:00Z",
      "_revision": 1
    },
    {
      "thingId": "sensor:temp001",
      "definition": "org.eclipse.ditto:sensor:1.0.0",
      "attributes": {
        "location": "Office Building A",
        "floor": 3
      },
      "features": {
        "temperature": {
          "properties": {
            "value": 23.5,
            "unit": "celsius"
          }
        }
      },
      "_created": "2025-09-24T22:26:00Z",
      "_modified": "2025-09-24T22:26:00Z",
      "_revision": 1
    }
  ],
  "count": 2,
  "source": "mongodb_direct"
}
```

---

## Get Specific Thing (GET by ID)

### Endpoint
```http
GET /mongodb/things/{thingId}
```

### Examples
```http
GET /mongodb/things/vehicle:fleet001
GET /mongodb/things/sensor:temp001
GET /mongodb/things/device:camera123
```

### Response (200 OK)
```json
{
  "thingId": "vehicle:fleet001",
  "definition": "org.eclipse.ditto:vehicle:1.0.0",
  "attributes": {
    "manufacturer": "Tesla",
    "model": "Model 3",
    "year": 2023,
    "vin": "5YJ3E1EA6KF123456"
  },
  "features": {
    "gps": {
      "properties": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "speed": 45.5
      }
    },
    "engine": {
      "properties": {
        "running": true,
        "battery_level": 85.2
      }
    }
  },
  "_created": "2025-09-24T22:25:00Z",
  "_modified": "2025-09-24T22:25:00Z",
  "_revision": 1
}
```

### Response (404 Not Found)
```json
{
  "error": "Thing 'nonexistent:thing' not found",
  "status": "not_found"
}
```

---

## Update Things (PUT)

### Endpoint
```http
PUT /mongodb/things/{thingId}
```

### Complete Replacement
```json
{
  "thingId": "vehicle:fleet001",
  "definition": "org.eclipse.ditto:vehicle:2.0.0",
  "attributes": {
    "manufacturer": "Tesla",
    "model": "Model 3",
    "year": 2024,
    "updated_feature": "Autopilot 3.0"
  },
  "features": {
    "gps": {
      "properties": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "speed": 0.0
      }
    },
    "engine": {
      "properties": {
        "running": false,
        "battery_level": 95.8,
        "charging": true
      }
    }
  }
}
```

### Response
- **204 No Content** (if Thing existed and was updated)
- **201 Created** (if Thing was created new)

---

## Partial Update (PATCH)

### Endpoint
```http
PATCH /mongodb/things/{thingId}
```

### Update Battery Level
```json
{
  "features": {
    "engine": {
      "properties": {
        "battery_level": 78.5,
        "charging": false
      }
    }
  }
}
```

### Update Location
```json
{
  "features": {
    "gps": {
      "properties": {
        "latitude": 34.0522,
        "longitude": -118.2437,
        "speed": 25.0,
        "timestamp": "2025-09-24T23:00:00Z"
      }
    }
  }
}
```

### Update Attributes
```json
{
  "attributes": {
    "owner": "New Owner Corp",
    "maintenance_date": "2025-09-24"
  }
}
```

### Response (204 No Content)
The Thing is updated and `_revision` is incremented.

---

## Delete Things (DELETE)

### Endpoint
```http
DELETE /mongodb/things/{thingId}
```

### Examples
```http
DELETE /mongodb/things/vehicle:fleet001
DELETE /mongodb/things/sensor:temp001
```

### Response
- **204 No Content** (Thing successfully deleted)
- **404 Not Found** (Thing doesn't exist)

---

## Error Handling

### 400 Bad Request
```json
{
  "error": "Missing required field: thingId",
  "status": "bad_request"
}
```

### 404 Not Found
```json
{
  "error": "Thing 'vehicle:nonexistent' not found",
  "status": "not_found"
}
```

### 409 Conflict
```json
{
  "error": "Thing with ID 'vehicle:fleet001' already exists",
  "status": "conflict"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database error: Connection timeout",
  "status": "internal_error"
}
```

### 503 Service Unavailable
```json
{
  "error": "MongoDB connection error: Cannot connect to server",
  "status": "database_unavailable"
}
```

---

## PowerShell Examples

### Create a Vehicle Thing
```powershell
$vehicleBody = @"
{
  "thingId": "vehicle:ps001",
  "definition": "org.eclipse.ditto:vehicle:1.0.0",
  "attributes": {
    "manufacturer": "Tesla",
    "model": "Model S",
    "year": 2024,
    "color": "Pearl White"
  },
  "features": {
    "gps": {
      "properties": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "speed": 0.0
      }
    },
    "engine": {
      "properties": {
        "running": false,
        "battery_level": 100.0,
        "range_remaining": 405
      }
    }
  }
}
"@

$result = Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things" -Method POST -ContentType "application/json" -Body $vehicleBody
Write-Host "Created Thing: $($result.thingId)" -ForegroundColor Green
```

### List All Things
```powershell
$things = Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things"
Write-Host "Total Things: $($things.count)" -ForegroundColor Yellow
$things.things | ForEach-Object {
    Write-Host "- $($_.thingId): $($_.attributes.manufacturer) $($_.attributes.model)"
}
```

### Get Specific Thing
```powershell
$thingId = "vehicle:ps001"
try {
    $thing = Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things/$thingId"
    Write-Host "Found Thing: $($thing.thingId)" -ForegroundColor Green
    Write-Host "Manufacturer: $($thing.attributes.manufacturer)"
    Write-Host "Model: $($thing.attributes.model)"
    Write-Host "Battery Level: $($thing.features.engine.properties.battery_level)%"
} catch {
    Write-Host "Thing not found: $thingId" -ForegroundColor Red
}
```

### Update Battery Level
```powershell
$updateBody = @"
{
  "features": {
    "engine": {
      "properties": {
        "battery_level": 85.5,
        "range_remaining": 347,
        "charging": false
      }
    }
  }
}
"@

Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things/vehicle:ps001" -Method PATCH -ContentType "application/json" -Body $updateBody
Write-Host "Battery level updated" -ForegroundColor Green
```

### Delete Thing
```powershell
$thingId = "vehicle:ps001"
try {
    Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things/$thingId" -Method DELETE
    Write-Host "Thing deleted: $thingId" -ForegroundColor Green
} catch {
    Write-Host "Failed to delete thing: $thingId" -ForegroundColor Red
}
```

---

## cURL Examples

### Create a Sensor Thing
```bash
curl -X POST http://localhost:5000/mongodb/things \
  -H "Content-Type: application/json" \
  -d '{
    "thingId": "sensor:curl001",
    "definition": "org.eclipse.ditto:sensor:1.0.0",
    "attributes": {
      "location": "Data Center",
      "rack": "R15",
      "unit": "U42"
    },
    "features": {
      "temperature": {
        "properties": {
          "value": 24.8,
          "unit": "celsius",
          "threshold_max": 35.0
        }
      },
      "humidity": {
        "properties": {
          "value": 42.3,
          "unit": "percent"
        }
      }
    }
  }'
```

### List All Things
```bash
curl -X GET http://localhost:5000/mongodb/things \
  -H "Accept: application/json"
```

### Get Specific Thing
```bash
curl -X GET http://localhost:5000/mongodb/things/sensor:curl001 \
  -H "Accept: application/json"
```

### Update Temperature
```bash
curl -X PATCH http://localhost:5000/mongodb/things/sensor:curl001 \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "temperature": {
        "properties": {
          "value": 26.2,
          "timestamp": "2025-09-24T23:30:00Z"
        }
      }
    }
  }'
```

### Delete Thing
```bash
curl -X DELETE http://localhost:5000/mongodb/things/sensor:curl001
```

---

## JavaScript/Browser Examples

### Create Thing with Fetch API
```javascript
const vehicleData = {
  thingId: "vehicle:js001",
  definition: "org.eclipse.ditto:vehicle:1.0.0",
  attributes: {
    manufacturer: "BMW",
    model: "i4 M50",
    year: 2024,
    color: "Storm Bay"
  },
  features: {
    gps: {
      properties: {
        latitude: 48.1351,
        longitude: 11.5820,
        speed: 0.0
      }
    },
    engine: {
      properties: {
        running: false,
        battery_level: 88.2,
        range_remaining: 265
      }
    }
  }
};

fetch('http://localhost:5000/mongodb/things', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(vehicleData)
})
.then(response => response.json())
.then(data => {
  console.log('Thing created:', data.thingId);
  console.log('Revision:', data._revision);
})
.catch(error => {
  console.error('Error creating thing:', error);
});
```

### List Things
```javascript
fetch('http://localhost:5000/mongodb/things')
  .then(response => response.json())
  .then(data => {
    console.log(`Found ${data.count} things:`);
    data.things.forEach(thing => {
      console.log(`- ${thing.thingId}: ${thing.attributes?.manufacturer || 'Unknown'} ${thing.attributes?.model || ''}`);
    });
  })
  .catch(error => {
    console.error('Error fetching things:', error);
  });
```

### Update Thing Location
```javascript
const locationUpdate = {
  features: {
    gps: {
      properties: {
        latitude: 52.5200,
        longitude: 13.4050,
        speed: 45.0,
        timestamp: new Date().toISOString()
      }
    }
  }
};

fetch('http://localhost:5000/mongodb/things/vehicle:js001', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(locationUpdate)
})
.then(response => {
  if (response.status === 204) {
    console.log('Location updated successfully');
  } else {
    console.error('Failed to update location');
  }
})
.catch(error => {
  console.error('Error updating location:', error);
});
```

---

## Python Examples

### Create Thing with Requests
```python
import requests
import json
from datetime import datetime

# Vehicle Thing data
vehicle_data = {
    "thingId": "vehicle:python001",
    "definition": "org.eclipse.ditto:vehicle:1.0.0",
    "attributes": {
        "manufacturer": "Ford",
        "model": "Mustang Mach-E",
        "year": 2024,
        "color": "Cyber Orange",
        "vin": "1FMEE5EP6NLA12345"
    },
    "features": {
        "gps": {
            "properties": {
                "latitude": 42.3314,
                "longitude": -83.0458,
                "speed": 0.0,
                "heading": 0.0,
                "timestamp": datetime.now().isoformat() + "Z"
            }
        },
        "engine": {
            "properties": {
                "running": False,
                "battery_level": 92.5,
                "range_remaining": 298,
                "charging": True,
                "charge_rate": 150.0
            }
        },
        "climate": {
            "properties": {
                "interior_temp": 22.0,
                "target_temp": 21.0,
                "hvac_on": True
            }
        }
    }
}

# Create Thing
response = requests.post(
    'http://localhost:5000/mongodb/things',
    headers={'Content-Type': 'application/json'},
    json=vehicle_data
)

if response.status_code == 201:
    thing = response.json()
    print(f"✅ Created Thing: {thing['thingId']}")
    print(f"📍 Location: {thing['features']['gps']['properties']['latitude']}, {thing['features']['gps']['properties']['longitude']}")
    print(f"🔋 Battery: {thing['features']['engine']['properties']['battery_level']}%")
else:
    print(f"❌ Failed to create Thing: {response.status_code}")
    print(response.text)
```

### List and Filter Things
```python
import requests

# Get all Things
response = requests.get('http://localhost:5000/mongodb/things')

if response.status_code == 200:
    data = response.json()
    print(f"📊 Total Things: {data['count']}")
    
    # Filter vehicles
    vehicles = [thing for thing in data['things'] if thing['thingId'].startswith('vehicle:')]
    print(f"🚗 Vehicles: {len(vehicles)}")
    
    for vehicle in vehicles:
        attrs = vehicle.get('attributes', {})
        battery = vehicle.get('features', {}).get('engine', {}).get('properties', {}).get('battery_level', 'N/A')
        print(f"  - {vehicle['thingId']}: {attrs.get('manufacturer', 'Unknown')} {attrs.get('model', '')} (Battery: {battery}%)")
    
    # Filter sensors
    sensors = [thing for thing in data['things'] if thing['thingId'].startswith('sensor:')]
    print(f"📡 Sensors: {len(sensors)}")
    
    for sensor in sensors:
        attrs = sensor.get('attributes', {})
        temp = sensor.get('features', {}).get('temperature', {}).get('properties', {}).get('value', 'N/A')
        print(f"  - {sensor['thingId']}: {attrs.get('location', 'Unknown location')} (Temp: {temp}°C)")
```

### Update Thing Properties
```python
import requests
from datetime import datetime

# Update vehicle location and status
thingId = "vehicle:python001"
update_data = {
    "features": {
        "gps": {
            "properties": {
                "latitude": 41.8781,
                "longitude": -87.6298,
                "speed": 55.0,
                "heading": 270.0,
                "timestamp": datetime.now().isoformat() + "Z"
            }
        },
        "engine": {
            "properties": {
                "running": True,
                "battery_level": 87.3,
                "range_remaining": 278,
                "charging": False
            }
        }
    }
}

response = requests.patch(
    f'http://localhost:5000/mongodb/things/{thingId}',
    headers={'Content-Type': 'application/json'},
    json=update_data
)

if response.status_code == 204:
    print(f"✅ Updated {thingId} successfully")
    
    # Verify update
    get_response = requests.get(f'http://localhost:5000/mongodb/things/{thingId}')
    if get_response.status_code == 200:
        thing = get_response.json()
        gps = thing['features']['gps']['properties']
        engine = thing['features']['engine']['properties']
        print(f"📍 New Location: {gps['latitude']}, {gps['longitude']}")
        print(f"🏃 Speed: {gps['speed']} mph")
        print(f"🔋 Battery: {engine['battery_level']}%")
        print(f"📈 Revision: {thing['_revision']}")
else:
    print(f"❌ Failed to update Thing: {response.status_code}")
```

### Delete Thing
```python
import requests

thingId = "vehicle:python001"

# First check if Thing exists
get_response = requests.get(f'http://localhost:5000/mongodb/things/{thingId}')

if get_response.status_code == 200:
    # Thing exists, delete it
    delete_response = requests.delete(f'http://localhost:5000/mongodb/things/{thingId}')
    
    if delete_response.status_code == 204:
        print(f"✅ Successfully deleted {thingId}")
    else:
        print(f"❌ Failed to delete {thingId}: {delete_response.status_code}")
else:
    print(f"🔍 Thing {thingId} not found")
```

---

## Best Practices

### 1. Thing ID Naming Convention
```
namespace:identifier
```
Examples:
- `vehicle:fleet001`
- `sensor:temp_building_a_floor_3`
- `device:camera_lobby_main`
- `asset:pump_station_1`

### 2. Use Meaningful Attributes
```json
{
  "attributes": {
    "manufacturer": "Tesla",
    "model": "Model 3",
    "serial_number": "SN123456789",
    "installation_date": "2025-01-15",
    "location": {
      "building": "Main Campus",
      "floor": 2,
      "room": "Server Room A"
    }
  }
}
```

### 3. Structured Feature Properties
```json
{
  "features": {
    "temperature": {
      "properties": {
        "value": 23.5,
        "unit": "celsius",
        "accuracy": 0.1,
        "timestamp": "2025-09-24T22:25:00Z",
        "status": "normal",
        "threshold_min": 18.0,
        "threshold_max": 28.0
      }
    }
  }
}
```

### 4. Error Handling
Always check HTTP status codes and handle errors appropriately:

```javascript
fetch('/mongodb/things', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(thingData)
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
})
.then(data => {
  console.log('Success:', data);
})
.catch(error => {
  console.error('Error:', error);
});
```

### 5. Batch Operations
For multiple operations, consider implementing batch processing logic in your application.

---

## Migration to Ditto

When the Eclipse Ditto clustering issue is resolved, the MongoDB-stored Things can be migrated to Ditto using the exact same schema structure, ensuring zero data loss and seamless transition.

---

## Support

For additional help and API documentation:
- **Live API Documentation**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/test-connections`
- **Platform Status**: `http://localhost:5000/api/status`

---

*Last Updated: September 24, 2025*
*API Version: 2.0.0*