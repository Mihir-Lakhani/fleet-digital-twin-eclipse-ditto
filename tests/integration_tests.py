import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

import pytest
from unittest.mock import patch, MagicMock
from communication import test_ditto_connection, test_mqtt_connection, test_mongodb_connection

class TestIntegration:
    
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