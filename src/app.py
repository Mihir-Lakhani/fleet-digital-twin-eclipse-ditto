import os
import sys
import json
import requests
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime

# Add current directory to Python path for relative imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from communication import test_ditto_connection, test_mqtt_connection, test_mongodb_connection

# Configure minimal Flask app (API only)
app = Flask(__name__)
CORS(app, origins=["*"])

@app.route('/api/health')
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
    return jsonify({
        "message": "Digital Twin API is running",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/status')
def api_status():
    return jsonify({
        "api_status": "operational",
        "service": "Digital Twin Fleet Management"
    })

@app.route('/api/openapi.json')
def openapi_spec():
    """Serve the OpenAPI specification for Swagger UI"""
    try:
        # Get the path to the openapi.json file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        config_dir = os.path.join(os.path.dirname(current_dir), 'config')
        openapi_path = os.path.join(config_dir, 'openapi.json')
        
        # Read and return the OpenAPI specification
        with open(openapi_path, 'r') as f:
            openapi_data = json.load(f)
        
        return jsonify(openapi_data)
    except Exception as e:
        return jsonify({
            "error": "Failed to load OpenAPI specification",
            "details": str(e)
        }), 500

# MongoDB client connection
def get_mongodb_client():
    """Get MongoDB client connection"""
    mongodb_url = os.getenv('MONGODB_URL', 'mongodb://mongodb:27017')
    return MongoClient(mongodb_url)

# MongoDB Things API (Direct database access)
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
        client = get_mongodb_client()
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
            
            # Add timestamps
            thing_data['_created'] = datetime.now().isoformat()
            thing_data['_modified'] = datetime.now().isoformat()
            
            try:
                result = things_collection.insert_one(thing_data)
                
                if result.inserted_id:
                    response = jsonify({
                        "success": True,
                        "thingId": thing_data['thingId'],
                        "message": f"Thing '{thing_data['thingId']}' created successfully",
                        "created": thing_data['_created']
                    })
                    response.status_code = 201
                    response.headers['Access-Control-Allow-Origin'] = '*'
                    response.headers['Location'] = f"/mongodb/things/{thing_data['thingId']}"
                    return response
                else:
                    return jsonify({
                        "error": "Failed to create thing",
                        "status": "internal_error"
                    }), 500
                    
            except Exception as e:
                if 'duplicate key' in str(e).lower():
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
            "status": "connection_error"
        }), 503

@app.route('/mongodb/things/<thing_id>', methods=['GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def mongodb_thing_by_id(thing_id):
    """MongoDB-based Thing operations by ID"""
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, PUT, DELETE, PATCH, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
        return response
    
    try:
        client = get_mongodb_client()
        db = client.digitaltwindb
        things_collection = db.things
        
        if request.method == 'GET':
            # Get specific Thing
            thing = things_collection.find_one({"thingId": thing_id}, {'_id': 0})
            
            if thing:
                response = jsonify(thing)
                response.headers['Access-Control-Allow-Origin'] = '*'
                return response
            else:
                return jsonify({
                    "error": f"Thing '{thing_id}' not found",
                    "status": "not_found"
                }), 404
        
        elif request.method == 'PUT':
            # Full update (upsert)
            thing_data = request.get_json()
            if not thing_data:
                return jsonify({
                    "error": "Missing Thing data in request body",
                    "status": "bad_request"
                }), 400
            
            # Ensure thingId matches URL parameter
            thing_data['thingId'] = thing_id
            thing_data['_modified'] = datetime.now().isoformat()
            
            # If no _created exists, add it (for new things)
            existing_thing = things_collection.find_one({"thingId": thing_id})
            if not existing_thing:
                thing_data['_created'] = datetime.now().isoformat()
            
            result = things_collection.replace_one(
                {"thingId": thing_id}, 
                thing_data, 
                upsert=True
            )
            
            if result.upserted_id or result.modified_count > 0:
                status_code = 201 if result.upserted_id else 200
                response = jsonify({
                    "success": True,
                    "thingId": thing_id,
                    "message": f"Thing '{thing_id}' {'created' if result.upserted_id else 'updated'} successfully",
                    "modified": thing_data['_modified']
                })
                response.status_code = status_code
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Location'] = f"/mongodb/things/{thing_id}"
                return response
            else:
                return jsonify({
                    "error": "No changes made to thing",
                    "status": "no_change"
                }), 304
        
        elif request.method == 'PATCH':
            # Partial update
            patch_data = request.get_json()
            if not patch_data:
                return jsonify({
                    "error": "Missing patch data in request body",
                    "status": "bad_request"
                }), 400
            
            # Add modification timestamp
            patch_data['_modified'] = datetime.now().isoformat()
            
            result = things_collection.update_one(
                {"thingId": thing_id},
                {"$set": patch_data}
            )
            
            if result.matched_count > 0:
                response = jsonify({
                    "success": True,
                    "thingId": thing_id,
                    "message": f"Thing '{thing_id}' updated successfully",
                    "modified": patch_data['_modified'],
                    "modified_count": result.modified_count
                })
                response.headers['Access-Control-Allow-Origin'] = '*'
                return response
            else:
                return jsonify({
                    "error": f"Thing '{thing_id}' not found",
                    "status": "not_found"
                }), 404
        
        elif request.method == 'DELETE':
            # Delete Thing
            result = things_collection.delete_one({"thingId": thing_id})
            
            if result.deleted_count > 0:
                response = jsonify({
                    "success": True,
                    "thingId": thing_id,
                    "message": f"Thing '{thing_id}' deleted successfully"
                })
                response.headers['Access-Control-Allow-Origin'] = '*'
                return response
            else:
                return jsonify({
                    "error": f"Thing '{thing_id}' not found",
                    "status": "not_found"
                }), 404
    
    except Exception as e:
        return jsonify({
            "error": f"Database operation error: {str(e)}",
            "status": "internal_error"
        }), 500

# Root route - Simple API info
@app.route('/')
def root():
    return jsonify({
        "service": "Digital Twin Fleet Management API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/api/health",
            "test_connections": "/test-connections",
            "mongodb_things": "/mongodb/things",
            "api_documentation": "See README.md for full API documentation"
        }
    })

if __name__ == '__main__':
    print("🚀 Starting Digital Twin Fleet Management API...")
    print("📡 Endpoints available:")
    print("   - http://localhost:5000/api/health (Health check)")
    print("   - http://localhost:5000/test-connections (Service connectivity)")
    print("   - http://localhost:5000/mongodb/things (Thing management)")
    print("   - http://localhost:5000/api/openapi.json (OpenAPI specification)")
    print("   - http://localhost:5000/ (API info)")
    
    app.run(host='0.0.0.0', port=5000, debug=True)