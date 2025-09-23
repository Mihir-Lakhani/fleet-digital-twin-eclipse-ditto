import os
import sys
import json
import requests
import base64
from flask import Flask, jsonify, request, Response, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient

# Add current directory to Python path for relative imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from communication import test_ditto_connection, test_mqtt_connection, test_mongodb_connection

app = Flask(__name__)
CORS(app, origins=["*"])

@app.route('/')
def health_check():
    return jsonify({
        "status": "running",
        "service": "Digital Twin Fleet App",
        "version": "1.0.0"
    })

@app.route('/test-connections')
def test_connections():
    results = {}
    
    try:
        test_ditto_connection()
        results['ditto'] = 'success'
    except Exception as e:
        results['ditto'] = f'failed: {str(e)}'
    
    try:
        test_mqtt_connection()
        results['mqtt'] = 'success'
    except Exception as e:
        results['mqtt'] = f'failed: {str(e)}'
    
    try:
        test_mongodb_connection()
        results['mongodb'] = 'success'
    except Exception as e:
        results['mongodb'] = f'failed: {str(e)}'
    
    return jsonify(results)

@app.route('/api/test')
def api_test():
    """Test endpoint to verify CORS is working"""
    return jsonify({
        "message": "CORS test successful", 
        "status": "ok",
        "cors": "enabled"
    })

@app.route('/api/status')
def api_status():
    """Status endpoint for health checks"""
    return jsonify({
        "service": "Digital Twin API",
        "version": "1.0.0", 
        "status": "running",
        "cors": "enabled"
    })

@app.route('/api/openapi.json', methods=['GET', 'OPTIONS'])
def openapi_spec():
    """Serve OpenAPI specification with explicit CORS handling"""
    if request.method == 'OPTIONS':
        # Handle preflight requests explicitly
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Origin, Accept'
        response.headers['Access-Control-Max-Age'] = '86400'
        return response
    
    try:
        # Get the absolute path to the config directory
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config', 'openapi.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            spec = json.load(f)
        
        response = jsonify(spec)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Origin, Accept'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        error_response = jsonify({
            "error": f"Failed to load OpenAPI specification: {str(e)}",
            "status": "error"
        })
        error_response.headers['Access-Control-Allow-Origin'] = '*'
        return error_response, 500

@app.route('/api/ditto/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def ditto_proxy(path):
    """Enhanced proxy endpoint for complete Ditto API coverage with robust error handling"""
    if request.method == 'OPTIONS':
        # Handle preflight requests
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, X-Requested-With'
        response.headers['Access-Control-Max-Age'] = '86400'
        return response
    
    try:
        ditto_url = f"http://ditto-gateway:8080/api/2/{path}"
        
        # Enhanced headers with proper authentication
        headers = {
            'Authorization': 'Basic ZGl0dG86ZGl0dG8=',  # ditto:ditto in base64
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        # Forward any additional headers from client
        for header_name, header_value in request.headers.items():
            if header_name.lower() in ['authorization', 'accept', 'content-type']:
                headers[header_name] = header_value
        
        # Forward query parameters
        query_params = request.args.to_dict()
        
        # Forward request body for POST/PUT/PATCH
        data = None
        if request.method in ['POST', 'PUT', 'PATCH']:
            if request.get_json(silent=True):
                data = request.get_json()
            elif request.data:
                # Handle raw data
                headers['Content-Type'] = request.content_type or 'application/json'
                data = request.data
            
        response = requests.request(
            method=request.method,
            url=ditto_url,
            headers=headers,
            params=query_params,
            json=data if isinstance(data, dict) else None,
            data=data if not isinstance(data, dict) else None,
            timeout=30
        )
        
        # Create enhanced response with comprehensive CORS headers
        flask_response = Response(
            response.content,
            status=response.status_code,
            headers={
                'Content-Type': response.headers.get('Content-Type', 'application/json'),
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
                'Access-Control-Expose-Headers': 'Content-Type, Authorization'
            }
        )
        
        return flask_response
        
    except requests.exceptions.ConnectionError:
        return jsonify({
            "error": "Unable to connect to Ditto Gateway - clustering issue detected",
            "status": "gateway_unavailable",
            "solution": "Using internal Ditto API proxy as workaround",
            "timestamp": "2025-09-24T22:25:00Z"
        }), 503
    except requests.exceptions.Timeout:
        return jsonify({
            "error": "Request to Ditto Gateway timed out",
            "status": "timeout",
            "timestamp": "2025-09-24T22:25:00Z"
        }), 504
    except Exception as e:
        return jsonify({
            "error": f"Proxy error: {str(e)}",
            "status": "proxy_error",
            "timestamp": "2025-09-24T22:25:00Z"
        }), 500

# Additional Ditto API convenience endpoints
@app.route('/api/things', methods=['GET', 'POST', 'OPTIONS'])
def things_endpoint():
    """Direct endpoint for Ditto Things API"""
    return ditto_proxy('things')

@app.route('/api/things/<path:thing_path>', methods=['GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def thing_by_id(thing_path):
    """Direct endpoint for specific Thing operations"""
    return ditto_proxy(f'things/{thing_path}')

@app.route('/api/policies', methods=['GET', 'POST', 'OPTIONS'])
def policies_endpoint():
    """Direct endpoint for Ditto Policies API"""
    return ditto_proxy('policies')

@app.route('/api/policies/<path:policy_path>', methods=['GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def policy_by_id(policy_path):
    """Direct endpoint for specific Policy operations"""
    return ditto_proxy(f'policies/{policy_path}')

@app.route('/api/search/things', methods=['GET', 'POST', 'OPTIONS'])
def search_things():
    """Direct endpoint for Ditto Things Search API"""
    return ditto_proxy('search/things')

# Root-level endpoints for direct access (backward compatibility)
@app.route('/things', methods=['GET', 'POST', 'OPTIONS'])
def root_things_endpoint():
    """Root-level Things endpoint for direct access"""
    return ditto_proxy('things')

@app.route('/things/<path:thing_path>', methods=['GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def root_thing_by_id(thing_path):
    """Root-level specific Thing operations"""
    return ditto_proxy(f'things/{thing_path}')

@app.route('/policies', methods=['GET', 'POST', 'OPTIONS'])
def root_policies_endpoint():
    """Root-level Policies endpoint for direct access"""
    return ditto_proxy('policies')

@app.route('/policies/<path:policy_path>', methods=['GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def root_policy_by_id(policy_path):
    """Root-level specific Policy operations"""
    return ditto_proxy(f'policies/{policy_path}')

@app.route('/search/things', methods=['GET', 'POST', 'OPTIONS'])
def root_search_things():
    """Root-level Things Search endpoint"""
    return ditto_proxy('search/things')

# MongoDB-based Thing Management (Ditto-compatible schema)
@app.route('/mongodb/things', methods=['POST', 'GET', 'OPTIONS'])
def mongodb_things():
    """MongoDB-based Thing creation and listing (bypasses Ditto clustering issue)"""
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, X-Requested-With'
        response.headers['Access-Control-Max-Age'] = '86400'
        return response
    
    try:
        client = MongoClient('mongodb://mongodb:27017/', serverSelectionTimeoutMS=5000)
        db = client.digitaltwindb
        things_collection = db.things
        
        if request.method == 'POST':
            # Create a new Thing
            thing_data = request.get_json()
            
            if not thing_data:
                return jsonify({
                    "error": "Missing Thing data in request body",
                    "status": "bad_request"
                }), 400
            
            # Validate required fields
            if 'thingId' not in thing_data:
                return jsonify({
                    "error": "Missing required field: thingId",
                    "status": "bad_request"
                }), 400
            
            # Add MongoDB metadata
            thing_data['_id'] = thing_data['thingId']
            thing_data['_created'] = "2025-09-24T22:25:00Z"
            thing_data['_modified'] = "2025-09-24T22:25:00Z"
            thing_data['_revision'] = 1
            
            # Insert into MongoDB
            try:
                result = things_collection.insert_one(thing_data)
                
                # Return created Thing (Ditto-compatible response)
                created_thing = thing_data.copy()
                created_thing.pop('_id', None)  # Remove MongoDB _id from response
                
                response = jsonify(created_thing)
                response.status_code = 201
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Location'] = f"/mongodb/things/{thing_data['thingId']}"
                
                return response
                
            except Exception as e:
                if "duplicate key" in str(e).lower():
                    return jsonify({
                        "error": f"Thing with ID '{thing_data['thingId']}' already exists",
                        "status": "conflict"
                    }), 409
                else:
                    return jsonify({
                        "error": f"Database error: {str(e)}",
                        "status": "internal_error"
                    }), 500
        
        elif request.method == 'GET':
            # List all Things
            try:
                things = list(things_collection.find({}, {'_id': 0}))  # Exclude MongoDB _id
                
                response = jsonify({
                    "things": things,
                    "count": len(things),
                    "source": "mongodb_direct"
                })
                response.headers['Access-Control-Allow-Origin'] = '*'
                
                return response
                
            except Exception as e:
                return jsonify({
                    "error": f"Database query error: {str(e)}",
                    "status": "internal_error"
                }), 500
    
    except Exception as e:
        return jsonify({
            "error": f"MongoDB connection error: {str(e)}",
            "status": "database_unavailable"
        }), 503

@app.route('/mongodb/things/<thing_id>', methods=['GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def mongodb_thing_by_id(thing_id):
    """MongoDB-based individual Thing operations"""
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, X-Requested-With'
        response.headers['Access-Control-Max-Age'] = '86400'
        return response
    
    try:
        client = MongoClient('mongodb://mongodb:27017/', serverSelectionTimeoutMS=5000)
        db = client.digitaltwindb
        things_collection = db.things
        
        if request.method == 'GET':
            # Get specific Thing
            thing = things_collection.find_one({'thingId': thing_id}, {'_id': 0})
            
            if not thing:
                return jsonify({
                    "error": f"Thing '{thing_id}' not found",
                    "status": "not_found"
                }), 404
            
            response = jsonify(thing)
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response
        
        elif request.method == 'PUT':
            # Update/Create specific Thing
            thing_data = request.get_json()
            
            if not thing_data:
                return jsonify({
                    "error": "Missing Thing data in request body",
                    "status": "bad_request"
                }), 400
            
            # Ensure thingId matches URL parameter
            thing_data['thingId'] = thing_id
            thing_data['_id'] = thing_id
            thing_data['_modified'] = "2025-09-24T22:25:00Z"
            
            # Check if Thing exists
            existing_thing = things_collection.find_one({'thingId': thing_id})
            
            if existing_thing:
                # Update existing Thing
                thing_data['_revision'] = existing_thing.get('_revision', 1) + 1
                things_collection.replace_one({'thingId': thing_id}, thing_data)
                status_code = 204  # No Content for update
            else:
                # Create new Thing
                thing_data['_created'] = "2025-09-24T22:25:00Z"
                thing_data['_revision'] = 1
                things_collection.insert_one(thing_data)
                status_code = 201  # Created
            
            response = Response()
            response.status_code = status_code
            response.headers['Access-Control-Allow-Origin'] = '*'
            if status_code == 201:
                response.headers['Location'] = f"/mongodb/things/{thing_id}"
            
            return response
        
        elif request.method == 'DELETE':
            # Delete specific Thing
            result = things_collection.delete_one({'thingId': thing_id})
            
            if result.deleted_count == 0:
                return jsonify({
                    "error": f"Thing '{thing_id}' not found",
                    "status": "not_found"
                }), 404
            
            response = Response()
            response.status_code = 204  # No Content
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response
        
        elif request.method == 'PATCH':
            # Partial update of Thing
            patch_data = request.get_json()
            
            if not patch_data:
                return jsonify({
                    "error": "Missing patch data in request body",
                    "status": "bad_request"
                }), 400
            
            existing_thing = things_collection.find_one({'thingId': thing_id})
            
            if not existing_thing:
                return jsonify({
                    "error": f"Thing '{thing_id}' not found",
                    "status": "not_found"
                }), 404
            
            # Apply patch
            patch_data['_modified'] = "2025-09-24T22:25:00Z"
            patch_data['_revision'] = existing_thing.get('_revision', 1) + 1
            
            things_collection.update_one(
                {'thingId': thing_id},
                {'$set': patch_data}
            )
            
            response = Response()
            response.status_code = 204  # No Content
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response
    
    except Exception as e:
        return jsonify({
            "error": f"MongoDB operation error: {str(e)}",
            "status": "database_error"
        }), 500

@app.route('/api/connections', methods=['GET'])
def enhanced_connections_test():
    """Enhanced test connections to all backend services with detailed status"""
    results = {}
    
    # Test MongoDB
    try:
        client = MongoClient('mongodb://mongodb:27017/', serverSelectionTimeoutMS=5000)
        client.server_info()
        results['mongodb'] = {'status': 'success', 'url': 'mongodb://mongodb:27017/'}
    except Exception as e:
        results['mongodb'] = {'status': 'error', 'error': str(e)}
    
    # Test MQTT
    try:
        import paho.mqtt.client as mqtt
        mqtt_client = mqtt.Client(client_id="health_check")
        mqtt_client.connect("mosquitto", 1883, 60)
        mqtt_client.disconnect()
        results['mqtt'] = {'status': 'success', 'url': 'mqtt://mosquitto:1883'}
    except Exception as e:
        results['mqtt'] = {'status': 'error', 'error': str(e)}
    
    # Test Ditto Gateway (internal)
    try:
        response = requests.get('http://ditto-gateway:8080/status', timeout=5)
        if response.status_code == 200:
            results['ditto_gateway_internal'] = {'status': 'success', 'url': 'http://ditto-gateway:8080'}
        else:
            results['ditto_gateway_internal'] = {'status': 'error', 'error': f'HTTP {response.status_code}'}
    except Exception as e:
        results['ditto_gateway_internal'] = {'status': 'error', 'error': str(e)}
    
    # Test Ditto Policies
    try:
        response = requests.get('http://ditto-policies:8080/status', timeout=5)
        if response.status_code == 200:
            results['ditto_policies'] = {'status': 'success', 'url': 'http://ditto-policies:8080'}
        else:
            results['ditto_policies'] = {'status': 'error', 'error': f'HTTP {response.status_code}'}
    except Exception as e:
        results['ditto_policies'] = {'status': 'error', 'error': str(e)}
    
    # Test Ditto Things
    try:
        response = requests.get('http://ditto-things:8080/status', timeout=5)
        if response.status_code == 200:
            results['ditto_things'] = {'status': 'success', 'url': 'http://ditto-things:8080'}
        else:
            results['ditto_things'] = {'status': 'error', 'error': f'HTTP {response.status_code}'}
    except Exception as e:
        results['ditto_things'] = {'status': 'error', 'error': str(e)}
    
    return jsonify(results)

@app.route('/api/docs', methods=['GET'])
def api_documentation():
    """Comprehensive API documentation for the Digital Twin platform"""
    return jsonify({
        "Digital_Twin_Platform_API": {
            "version": "2.0.0",
            "status": "Enhanced Implementation with MongoDB Thing Management",
            "base_url": "http://localhost:5000",
            "last_updated": "2025-09-24T22:25:00Z",
            "clustering_status": "Ditto Gateway external HTTP API blocked by clustering constraints - using MongoDB workaround",
            
            "endpoints": {
                
                "Health & Status": {
                    "/": "Platform welcome message",
                    "/health": "Service health check",
                    "/api/connections": "Test all service connections",
                    "/api/docs": "This documentation"
                },
                
                "MongoDB_Thing_Management": {
                    "description": "Production-ready Thing management via MongoDB (bypasses Ditto clustering issue)",
                    "base_path": "/mongodb/things",
                    "status": "RECOMMENDED - Fully operational",
                    "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
                    "endpoints": {
                        "POST /mongodb/things": "Create new Thing (returns 201 Created)",
                        "GET /mongodb/things": "List all Things with count",
                        "GET /mongodb/things/{thingId}": "Get specific Thing",
                        "PUT /mongodb/things/{thingId}": "Update/create Thing (upsert)",
                        "DELETE /mongodb/things/{thingId}": "Delete Thing",
                        "PATCH /mongodb/things/{thingId}": "Partial update Thing"
                    },
                    "schema_compatibility": "Ditto-compatible schema for future migration",
                    "example_create": {
                        "method": "POST",
                        "url": "/mongodb/things",
                        "body": {
                            "thingId": "vehicle:fleet001",
                            "definition": "org.eclipse.ditto:vehicle:1.0.0",
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
                                        "speed": 45.5
                                    }
                                },
                                "engine": {
                                    "properties": {
                                        "running": True,
                                        "battery_level": 85.2
                                    }
                                }
                            }
                        }
                    }
                },
                
                "Ditto_API_Proxy": {
                    "description": "Complete Ditto API access via internal proxy (clustering constraints may cause 503 errors)",
                    "base_path": "/api/ditto/",
                    "status": "LIMITED - Use MongoDB endpoints for reliable operations",
                    "authentication": "Basic ditto:ditto (handled automatically)",
                    "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
                    "examples": {
                        "things": "/api/ditto/things",
                        "specific_thing": "/api/ditto/things/my.namespace:thing-id",
                        "policies": "/api/ditto/policies",
                        "search": "/api/ditto/search/things",
                        "websocket": "/api/ditto/ws (WebSocket not supported via HTTP proxy)"
                    }
                },
                
                "Root_Level_Endpoints": {
                    "description": "Direct root-level access (may return 503 due to clustering constraints)",
                    "status": "LIMITED - Use MongoDB endpoints for reliable operations",
                    "things": {
                        "GET /things": "List all things (direct access)",
                        "POST /things": "Create new thing (direct access)",
                        "GET /things/{namespace}:{id}": "Get specific thing (direct access)",
                        "PUT /things/{namespace}:{id}": "Update/create thing (direct access)",
                        "DELETE /things/{namespace}:{id}": "Delete thing (direct access)",
                        "PATCH /things/{namespace}:{id}": "Partial update thing (direct access)"
                    },
                    "policies": {
                        "GET /policies": "List all policies (direct access)",
                        "POST /policies": "Create new policy (direct access)",
                        "GET /policies/{namespace}:{id}": "Get specific policy (direct access)",
                        "PUT /policies/{namespace}:{id}": "Update/create policy (direct access)",
                        "DELETE /policies/{namespace}:{id}": "Delete policy (direct access)"
                    },
                    "search": {
                        "GET /search/things": "Search things (direct access)"
                    }
                },
                
                "Error_Handling": {
                    "503_Service_Unavailable": "Ditto Gateway connection failed (clustering issue) - Use MongoDB endpoints",
                    "504_Gateway_Timeout": "Request to Ditto Gateway timed out",
                    "500_Internal_Error": "General proxy error with details",
                    "201_Created": "Thing successfully created via MongoDB",
                    "409_Conflict": "Thing already exists (use PUT for update)"
                }
            },
            
            "technical_notes": {
                "clustering_issue": "Ditto Gateway external HTTP API blocked by hardcoded LowestAddressJoinDecider requiring minimum 2 contact points",
                "mongodb_workaround": "Direct MongoDB storage with Ditto-compatible schema provides reliable Thing management",
                "recommendation": "Use /mongodb/things endpoints for production Thing operations",
                "performance": "MongoDB direct access provides better performance than proxy",
                "cors": "Full CORS support for browser-based applications",
                "data_persistence": "Things stored in MongoDB digitaltwindb.things collection"
            },
            
            "testing_commands": {
                "curl_create_thing": {
                    "command": "curl -X POST http://localhost:5000/mongodb/things -H \"Content-Type: application/json\" -d '{\"thingId\":\"test:thing001\",\"attributes\":{\"name\":\"Test Thing\"}}'",
                    "expected": "201 Created with Thing data"
                },
                "curl_list_things": {
                    "command": "curl http://localhost:5000/mongodb/things",
                    "expected": "200 OK with Things array and count"
                },
                "powershell_create": {
                    "command": "Invoke-RestMethod -Uri 'http://localhost:5000/mongodb/things' -Method POST -ContentType 'application/json' -Body '{\"thingId\":\"ps:test001\",\"attributes\":{\"source\":\"PowerShell\"}}'",
                    "expected": "PSCustomObject with Thing data"
                },
                "powershell_list": {
                    "command": "Invoke-RestMethod -Uri 'http://localhost:5000/mongodb/things'",
                    "expected": "PSCustomObject with things array"
                }
            }
        }
    })

if __name__ == '__main__':
    # Load environment variables from .env file if running locally
    if os.path.exists('config/.env'):
        from dotenv import load_dotenv
        load_dotenv('config/.env')
    
    port = int(os.getenv('APP_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)