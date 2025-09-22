#!/usr/bin/env python3
"""
Test script to check all service connections with environment variables loaded from .env file
"""

import os
import sys
from pathlib import Path

# Add src directory to Python path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    env_file = Path(__file__).parent.parent / "config" / ".env"
    if env_file.exists():
        load_dotenv(env_file)
        print(f"✓ Loaded environment variables from {env_file}")
    else:
        print(f"⚠ Environment file not found: {env_file}")
except ImportError:
    print("⚠ python-dotenv not installed. Using system environment variables only.")

# Import and run connection tests
from communication import test_ditto_connection, test_mqtt_connection, test_mongodb_connection

def main():
    print("\n" + "="*50)
    print("Digital Twin Service Connection Tests")
    print("="*50)
    
    print("\nEnvironment Variables:")
    print(f"  ECLIPSE_DITTO_API_URL: {os.getenv('ECLIPSE_DITTO_API_URL', 'NOT SET')}")
    print(f"  MQTT_BROKER_URL: {os.getenv('MQTT_BROKER_URL', 'NOT SET')}")
    print(f"  DATABASE_URL: {os.getenv('DATABASE_URL', 'NOT SET')}")
    print(f"  APP_PORT: {os.getenv('APP_PORT', 'NOT SET')}")
    
    print("\nTesting Connections:")
    print("-" * 30)
    
    print("\n1. Testing Eclipse Ditto connection...")
    test_ditto_connection()
    
    print("\n2. Testing MQTT broker connection...")
    test_mqtt_connection()
    
    print("\n3. Testing MongoDB connection...")
    test_mongodb_connection()
    
    print("\n" + "="*50)
    print("Connection tests completed!")
    print("="*50)

if __name__ == "__main__":
    main()