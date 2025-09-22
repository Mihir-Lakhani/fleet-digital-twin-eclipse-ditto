import os
import requests
import paho.mqtt.client as mqtt
from pymongo import MongoClient

def test_ditto_connection():
    url = os.getenv("ECLIPSE_DITTO_API_URL")
    key = os.getenv("ECLIPSE_DITTO_API_KEY")
    if not url or not key:
        print("Eclipse Ditto environment variables not set. Skipping Ditto connection test.")
        return
    
    headers = {"Authorization": f"Bearer {key}"}
    try:
        resp = requests.get(url, headers=headers, timeout=5)
        resp.raise_for_status()
        print("Eclipse Ditto connected successfully.")
    except Exception as e:
        print(f"Failed to connect to Eclipse Ditto: {e}")

def test_mqtt_connection():
    mqtt_url = os.getenv("MQTT_BROKER_URL")
    if not mqtt_url:
        print("MQTT_BROKER_URL environment variable not set. Skipping MQTT connection test.")
        return
    
    broker_url = mqtt_url.replace("tcp://", "").split(':')[0]
    broker_port = int(mqtt_url.split(":")[-1])
    user = os.getenv("MQTT_BROKER_USER")
    password = os.getenv("MQTT_BROKER_PASSWORD")

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.username_pw_set(user, password)
    try:
        client.connect(broker_url, broker_port, 60)
        print("MQTT broker connected successfully.")
        client.disconnect()
    except Exception as e:
        print(f"Failed to connect to MQTT broker: {e}")

def test_mongodb_connection():
    mongo_url = os.getenv("DATABASE_URL")
    if not mongo_url:
        print("DATABASE_URL environment variable not set. Skipping MongoDB connection test.")
        return
    
    try:
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("MongoDB connected successfully.")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")

if __name__ == "__main__":
    test_ditto_connection()
    test_mqtt_connection()
    test_mongodb_connection()
