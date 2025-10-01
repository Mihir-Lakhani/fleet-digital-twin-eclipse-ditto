# MongoDB Car Digital Twin Query Commands

## Quick MongoDB Commands for Car Digital Twin

### 1. Connect to MongoDB Shell
```bash
docker exec -it mongodb mongosh digitaltwindb
```

### 2. Basic Queries

#### Find your car digital twin
```javascript
db.things.find({"thingId": "car:horn-car-001"}).pretty()
```

#### Get only horn status
```javascript
db.things.find(
  {"thingId": "car:horn-car-001"}, 
  {"features.horn.properties.status": 1, "_id": 0}
).pretty()
```

#### Get only horn configuration
```javascript
db.things.find(
  {"thingId": "car:horn-car-001"}, 
  {"features.horn.properties.configuration": 1, "_id": 0}
).pretty()
```

#### Get car metadata only
```javascript
db.things.find(
  {"thingId": "car:horn-car-001"}, 
  {"attributes.metadata": 1, "_id": 0}
).pretty()
```

### 3. Update Queries (if needed)

#### Update horn activation count
```javascript
db.things.updateOne(
  {"thingId": "car:horn-car-001"},
  {$inc: {"features.horn.properties.status.activationCount": 1}}
)
```

#### Update horn state
```javascript
db.things.updateOne(
  {"thingId": "car:horn-car-001"},
  {$set: {"features.horn.properties.status.state": "ON"}}
)
```

### 4. Advanced Queries

#### Count all digital twins
```javascript
db.things.count()
```

#### Find all vehicle-type digital twins
```javascript
db.things.find({"attributes.specifications.type": "car"}).pretty()
```

#### Get horn activation statistics
```javascript
db.things.aggregate([
  {$match: {"thingId": "car:horn-car-001"}},
  {$project: {
    "hornState": "$features.horn.properties.status.state",
    "activationCount": "$features.horn.properties.status.activationCount",
    "lastActivated": "$features.horn.properties.status.lastActivated"
  }}
])
```

### 5. JSON Export Commands

#### Export car digital twin to JSON file
```bash
docker exec mongodb mongoexport --db=digitaltwindb --collection=things --query='{"thingId":"car:horn-car-001"}' --out=/tmp/car_twin_export.json --pretty
```

#### Copy exported file from container
```bash
docker cp mongodb:/tmp/car_twin_export.json ./car_twin_export.json
```

### 6. Monitoring Queries

#### Watch for horn state changes (real-time)
```javascript
db.things.watch([
  {$match: {"fullDocument.thingId": "car:horn-car-001"}}
])
```

#### Check when horn was last modified
```javascript
db.things.find(
  {"thingId": "car:horn-car-001"}, 
  {"_modified": 1, "attributes.metadata.lastModified": 1}
).pretty()
```

## Current Status Summary
- **Thing ID**: car:horn-car-001
- **Horn State**: OFF
- **Activation Count**: 48
- **Database**: digitaltwindb
- **Collection**: things
- **MongoDB Document ID**: 68dc22ae429b592ef196e6d4