import os
import sys
from flask import Flask, jsonify
from communication import test_ditto_connection, test_mqtt_connection, test_mongodb_connection

app = Flask(__name__)

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

if __name__ == '__main__':
    # Load environment variables from .env file if running locally
    if os.path.exists('config/.env'):
        from dotenv import load_dotenv
        load_dotenv('config/.env')
    
    port = int(os.getenv('APP_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)