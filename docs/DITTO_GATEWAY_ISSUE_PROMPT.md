# Eclipse Ditto Gateway Clustering Issue - AI Assistant Brief

## Problem Summary
We have a **persistent and critical issue** with Eclipse Ditto Gateway (version 3.4.0) that has been **blocking HTTP API access since the project's inception**. Despite extensive troubleshooting and configuration attempts, the Ditto Gateway refuses to accept HTTP requests from external sources, consistently returning clustering-related errors.

## Issue Manifestation
- **Swagger UI**: Successfully loads OpenAPI specification but shows "Failed to fetch" errors when testing Ditto proxy endpoints (`/api/ditto/*`)
- **Direct API Access**: All HTTP requests to `ditto-gateway:8080/api/2/*` endpoints fail
- **Container Status**: All Ditto services (policies, things, gateway) show as "healthy" in Docker
- **Internal Communication**: Ditto microservices communicate internally without issues

## Current Architecture Status

### ✅ **WORKING COMPONENTS**
- **Flask Application** (port 5000): Fully functional with CORS enabled
- **Swagger UI Integration**: Complete OpenAPI 3.0.3 specification loading successfully
- **MongoDB** (port 27017): Connected and operational
- **MQTT Broker** (port 1883, 9001): Working with proper authentication
- **Container Networking**: All services communicate via `digital_twin_network`
- **Health Endpoints**: All basic Flask endpoints return 200 OK responses

### ❌ **FAILING COMPONENT**
- **Ditto Gateway HTTP API**: External HTTP access completely blocked despite multiple configuration attempts

## What We've Attempted (Comprehensive Troubleshooting History)

### 1. **Container Configuration Modifications**
```yaml
# Tried multiple environment variable combinations:
- DITTO_DISABLE_CLUSTERING=true
- DITTO_CLUSTER_SINGLE_NODE=true  
- DITTO_CLUSTER_BOOTSTRAP_REQUIRED=false
- DITTO_CLUSTER_ENABLE=false
- CLUSTER_BS_REQUIRED=false
- AKKA_CLUSTER_BOOTSTRAP_REQUIRED=false
- DITTO_CLUSTER_DOWN_UNREACHABLE_AFTER=10s
```

### 2. **Networking Attempts**
- Used container names (`ditto-gateway`) for internal communication
- Used `localhost` for external browser access
- Verified Docker network connectivity between all services
- Confirmed port mappings (8080:8080) are correct
- Tested direct `curl` commands to gateway endpoints

### 3. **CORS and Proxy Implementation**
- Implemented comprehensive Flask-CORS configuration with wildcard origins
- Added explicit OPTIONS method handling for all Ditto proxy endpoints
- Created `/api/ditto/<path:path>` proxy with Basic Authentication
- Added proper Authorization headers (`ditto:ditto` base64 encoded)

### 4. **OpenAPI and Swagger UI Integration**
- Fixed OpenAPI 3.0.3 specification serving from Flask app
- Resolved Swagger UI configuration to load from `localhost:5000/api/openapi.json`
- Successfully eliminated "Unable to render this definition" errors
- Confirmed Swagger UI can test all non-Ditto endpoints successfully

### 5. **Docker Compose Variations Tested**
- Standard Eclipse Ditto configuration from official documentation
- Simplified single-container approach
- Enhanced multi-service stack with all Ditto microservices
- Various combinations of environment variables and volume mounts

## Current Configuration Files

### docker-compose-final.yaml (Ditto Gateway Section)
```yaml
ditto-gateway:
  image: eclipse/ditto-gateway:3.4.0
  container_name: ditto-gateway
  restart: unless-stopped
  ports:
    - "8080:8080"
  environment:
    - DITTO_DISABLE_CLUSTERING=true
    - DITTO_CLUSTER_SINGLE_NODE=true
    - DITTO_CLUSTER_BOOTSTRAP_REQUIRED=false
    - DITTO_CLUSTER_ENABLE=false
    - CLUSTER_BS_REQUIRED=false
    - AKKA_CLUSTER_BOOTSTRAP_REQUIRED=false
  depends_on:
    - ditto-policies
    - ditto-things
  networks:
    - digital_twin_network
```

### Flask Ditto Proxy Implementation
```python
@app.route('/api/ditto/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def ditto_proxy(path):
    if request.method == 'OPTIONS':
        response = Response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', '*')
        return response
    
    ditto_url = f"http://ditto-gateway:8080/api/2/{path}"
    headers = {
        'Authorization': 'Basic ZGl0dG86ZGl0dG8=',  # ditto:ditto
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.request(
            method=request.method,
            url=ditto_url,
            headers=headers,
            params=request.args,
            json=request.get_json() if request.is_json else None,
            timeout=30
        )
        return Response(response.content, status=response.status_code, headers=dict(response.headers))
    except Exception as e:
        return jsonify({"error": f"Ditto Gateway connection failed: {str(e)}"}), 502
```

## Error Patterns Observed

### 1. **Container Logs**
```
ditto-gateway | WARN  a.c.ConfigFactory - Config warning: /ditto-gateway.conf: 227: path parameter 'akka.cluster.seed-nodes' is not a known configuration setting
ditto-gateway | INFO  a.a.ActorSystemImpl - Cluster Bootstrap failed, retrying in 10000ms: akka.cluster.bootstrap.ClusterBootstrapTimeoutException
```

### 2. **HTTP Response Patterns**
- Connection timeouts on all `/api/2/*` endpoints
- No HTTP response headers returned
- Network connectivity confirmed but application layer blocking requests

### 3. **Internal Service Communication**
- All Ditto microservices show healthy status
- Internal Docker network communication functional
- Only external HTTP API access is blocked

## Technical Context

### Environment
- **OS**: Windows with Docker Desktop
- **Docker Compose**: Latest version with `digital_twin_network` bridge network
- **Eclipse Ditto**: Version 3.4.0 (latest stable)
- **Python Flask**: 3.1.0 with Flask-CORS 5.0.0
- **Container Runtime**: All services running in isolated containers

### Success Metrics Achieved
- Swagger UI renders complete API documentation
- Health endpoints return proper JSON responses
- MongoDB and MQTT connections validated
- Container orchestration working correctly
- OpenAPI 3.0.3 specification serving successfully

## What We Need

### Primary Objective
**Resolve Eclipse Ditto Gateway clustering configuration to enable HTTP API access while preserving all successfully implemented CORS, OpenAPI, and Flask functionality.**

### Specific Requirements
1. Enable external HTTP access to `ditto-gateway:8080/api/2/*` endpoints
2. Maintain current working Flask application and Swagger UI integration
3. Preserve container networking and service dependencies
4. Allow successful testing of thing creation, policy management, and other Ditto operations through Swagger UI

### Critical Constraints
- Cannot break existing working components (Flask app, MongoDB, MQTT, Swagger UI)
- Must work within Docker Compose container environment
- Should use Eclipse Ditto 3.4.0 (latest stable release)
- Need solution that addresses the root clustering configuration issue, not workarounds

## Hypothesis
The issue appears to be that **Eclipse Ditto 3.4.0 has hardcoded clustering requirements** that cannot be disabled through standard environment variables. The gateway expects a full Akka cluster setup even in single-node configurations, preventing HTTP API initialization.

**Request**: Please provide a definitive solution to configure Eclipse Ditto Gateway for single-node operation with external HTTP API access enabled, or alternative approaches that can resolve this persistent clustering blocking issue.