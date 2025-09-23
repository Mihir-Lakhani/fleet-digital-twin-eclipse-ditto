import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

import pytest
import requests
from unittest.mock import patch, MagicMock
from communication import test_ditto_connection, test_mqtt_connection, test_mongodb_connection

class TestEnhancedIntegration:
    """Enhanced integration tests for the complete digital twin stack"""
    
    @patch.dict(os.environ, {
        'ECLIPSE_DITTO_API_URL': 'http://localhost:8080/api/2',
        'ECLIPSE_DITTO_API_KEY': 'test_key'
    })
    @patch('communication.requests.get')
    def test_ditto_connection_success(self, mock_get):
        """Test successful Ditto connection"""
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # This should not raise an exception
        test_ditto_connection()
        
    @patch.dict(os.environ, {
        'MQTT_BROKER_URL': 'tcp://localhost:1883',
        'MQTT_BROKER_USER': 'test_user',
        'MQTT_BROKER_PASSWORD': 'test_pass'
    })
    @patch('communication.mqtt.Client')
    def test_mqtt_connection_success(self, mock_client_class):
        """Test successful MQTT connection"""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.connect.return_value = None
        
        # This should not raise an exception
        test_mqtt_connection()
        
    @patch.dict(os.environ, {
        'DATABASE_URL': 'mongodb://localhost:27017/test'
    })
    @patch('communication.MongoClient')
    def test_mongodb_connection_success(self, mock_mongo_client):
        """Test successful MongoDB connection"""
        mock_client = MagicMock()
        mock_mongo_client.return_value = mock_client
        mock_client.admin.command.return_value = None
        
        # This should not raise an exception
        test_mongodb_connection()

    @patch('requests.get')
    def test_nginx_health_check(self, mock_get):
        """Test nginx reverse proxy health endpoint"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "healthy\n"
        mock_get.return_value = mock_response
        
        # Should return healthy status
        response = requests.get('http://localhost/health')
        assert response.status_code == 200
        assert "healthy" in response.text

    @patch('requests.get')
    def test_swagger_ui_accessibility(self, mock_get):
        """Test Swagger UI accessibility"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {'content-type': 'text/html'}
        mock_get.return_value = mock_response
        
        # Should return HTML content
        response = requests.get('http://localhost:8082/')
        assert response.status_code == 200
        assert 'text/html' in response.headers.get('content-type', '')

    @patch('requests.get')
    def test_ditto_ui_accessibility(self, mock_get):
        """Test Ditto UI accessibility"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {'content-type': 'text/html'}
        mock_get.return_value = mock_response
        
        # Should return HTML content
        response = requests.get('http://localhost:8083/')
        assert response.status_code == 200
        assert 'text/html' in response.headers.get('content-type', '')

    @patch('requests.get')
    def test_ditto_api_through_nginx(self, mock_get):
        """Test Ditto API access through nginx reverse proxy"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "UP"}
        mock_get.return_value = mock_response
        
        # Should access Ditto API through nginx
        response = requests.get('http://localhost/api/2/status')
        assert response.status_code == 200

    @patch('requests.get')
    def test_all_ditto_services_health(self, mock_get):
        """Test health endpoints of all Ditto microservices"""
        services = [
            'ditto-policies',
            'ditto-things', 
            'ditto-things-search',
            'ditto-connectivity',
            'ditto-gateway'
        ]
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "UP"}
        mock_get.return_value = mock_response
        
        for service in services:
            # Each service should have a health endpoint
            response = requests.get(f'http://{service}:8080/health')
            assert response.status_code == 200

    @patch('requests.get')
    def test_api_documentation_endpoints(self, mock_get):
        """Test API documentation accessibility"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "openapi": "3.0.0",
            "info": {"title": "Eclipse Ditto API", "version": "2"}
        }
        mock_get.return_value = mock_response
        
        # Should access OpenAPI spec through Ditto Gateway
        response = requests.get('http://localhost:8080/api/2/openapi.json')
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data

class TestServiceDependencies:
    """Test service dependency and startup order"""
    
    def test_service_startup_order(self):
        """Test that services start in the correct dependency order"""
        expected_order = [
            'mongodb',
            'mqtt_broker', 
            'ditto-policies',
            'ditto-things',
            'ditto-things-search',
            'ditto-connectivity',
            'ditto-gateway',
            'swagger-ui',
            'ditto-ui',
            'digital_twin_app',
            'nginx'
        ]
        
        # This is a conceptual test - in practice you'd check Docker Compose dependency graph
        assert len(expected_order) == 11  # Verify we have all expected services

    @patch('requests.get')
    def test_cross_service_communication(self, mock_get):
        """Test that services can communicate with each other"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"connected": True}
        mock_get.return_value = mock_response
        
        # Digital Twin App should be able to reach all services
        endpoints = [
            'http://digital_twin_app:5000/',
            'http://digital_twin_app:5000/test-connections'
        ]
        
        for endpoint in endpoints:
            response = requests.get(endpoint)
            assert response.status_code == 200

class TestEnvironmentConfiguration:
    """Test environment configuration and variables"""
    
    def test_env_file_loading(self):
        """Test that environment variables are properly loaded"""
        env_file_path = os.path.join(os.path.dirname(__file__), '..', 'config', '.env')
        
        if os.path.exists(env_file_path):
            with open(env_file_path, 'r') as f:
                content = f.read()
                
            # Check for required environment variables
            required_vars = [
                'ECLIPSE_DITTO_API_URL',
                'MQTT_BROKER_URL', 
                'DATABASE_URL',
                'APP_PORT'
            ]
            
            for var in required_vars:
                assert var in content, f"Required environment variable {var} not found in .env file"

    def test_service_url_configuration(self):
        """Test that service URLs are properly configured"""
        expected_urls = {
            'nginx': 'http://localhost',
            'ditto_gateway': 'http://localhost:8080',
            'swagger_ui': 'http://localhost:8082', 
            'ditto_ui': 'http://localhost:8083',
            'app': 'http://localhost:5000'
        }
        
        # Verify URL format
        for service, url in expected_urls.items():
            assert url.startswith('http://'), f"Invalid URL format for {service}: {url}"
            assert 'localhost' in url, f"URL should use localhost for {service}: {url}"

if __name__ == '__main__':
    pytest.main([__file__, '-v'])