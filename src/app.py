import os
import sys
import requests
from flask import Flask, jsonify, request, Response, send_from_directory
from flask_cors import CORS
import os
import json
import requests
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
    """Proxy endpoint for Ditto API with CORS headers"""
    if request.method == 'OPTIONS':
        # Handle preflight requests
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    try:
        ditto_url = f"http://ditto-gateway:8080/api/2/{path}"
        
        # Forward the request to Ditto with authentication
        headers = {
            'Authorization': 'Basic ZGl0dG86ZGl0dG8=',  # ditto:ditto in base64
            'Content-Type': 'application/json'
        }
        
        # Forward query parameters
        query_params = request.args.to_dict()
        
        # Forward request body for POST/PUT/PATCH
        data = None
        if request.method in ['POST', 'PUT', 'PATCH'] and request.get_json():
            data = request.get_json()
            
        response = requests.request(
            method=request.method,
            url=ditto_url,
            headers=headers,
            params=query_params,
            json=data,
            timeout=30
        )
        
        # Create response with CORS headers
        flask_response = Response(
            response.content,
            status=response.status_code,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        )
        
        return flask_response
        
    except Exception as e:
        return jsonify({
            "error": f"Proxy error: {str(e)}",
            "status": "error"
        }), 500

if __name__ == '__main__':
    # Load environment variables from .env file if running locally
    if os.path.exists('config/.env'):
        from dotenv import load_dotenv
        load_dotenv('config/.env')
    
    port = int(os.getenv('APP_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)