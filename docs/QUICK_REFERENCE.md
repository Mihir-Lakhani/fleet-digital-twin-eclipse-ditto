# Quick Reference - MongoDB Thing Management

## Essential Endpoints
- **Create**: `POST /mongodb/things`
- **List**: `GET /mongodb/things`
- **Get**: `GET /mongodb/things/{thingId}`
- **Update**: `PUT /mongodb/things/{thingId}`
- **Patch**: `PATCH /mongodb/things/{thingId}`
- **Delete**: `DELETE /mongodb/things/{thingId}`

## PowerShell Quick Examples

### Create Vehicle
```powershell
$body = '{"thingId":"vehicle:quick001","attributes":{"manufacturer":"Tesla","model":"Model 3"},"features":{"gps":{"properties":{"latitude":37.7749,"longitude":-122.4194}}}}'
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things" -Method POST -ContentType "application/json" -Body $body
```

### List All Things
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things"
```

### Get Specific Thing
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things/vehicle:quick001"
```

### Update Battery
```powershell
$update = '{"features":{"engine":{"properties":{"battery_level":85.5}}}}'
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things/vehicle:quick001" -Method PATCH -ContentType "application/json" -Body $update
```

### Delete Thing
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/mongodb/things/vehicle:quick001" -Method DELETE
```

## cURL Quick Examples

### Create Sensor
```bash
curl -X POST http://localhost:5000/mongodb/things \
  -H "Content-Type: application/json" \
  -d '{"thingId":"sensor:quick001","attributes":{"location":"Office"},"features":{"temperature":{"properties":{"value":23.5}}}}'
```

### List All Things
```bash
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