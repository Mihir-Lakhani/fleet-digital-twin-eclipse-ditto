#!/usr/bin/env python3
"""
Script to insert Car Digital Twin data into MongoDB
This script reads the car_digital_twin.json file and inserts it into the MongoDB things collection
"""

import json
import pymongo
from datetime import datetime

def insert_car_digital_twin():
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client["digitaltwindb"]
        collection = db["things"]
        
        # Read the car digital twin JSON file
        with open("data/car_digital_twin.json", "r") as f:
            car_twin_data = json.load(f)
        
        # Add MongoDB-specific fields
        car_twin_data["_created"] = datetime.now().isoformat()
        car_twin_data["_modified"] = datetime.now().isoformat()
        
        # Check if the car twin already exists
        existing = collection.find_one({"thingId": car_twin_data["thingId"]})
        
        if existing:
            # Update existing document
            result = collection.replace_one(
                {"thingId": car_twin_data["thingId"]}, 
                car_twin_data
            )
            print(f"✅ Updated existing car digital twin in MongoDB")
            print(f"   Thing ID: {car_twin_data['thingId']}")
            print(f"   Modified count: {result.modified_count}")
        else:
            # Insert new document
            result = collection.insert_one(car_twin_data)
            print(f"✅ Inserted car digital twin into MongoDB")
            print(f"   Thing ID: {car_twin_data['thingId']}")
            print(f"   Document ID: {result.inserted_id}")
        
        # Verify the insertion
        twin_in_db = collection.find_one({"thingId": car_twin_data["thingId"]})
        if twin_in_db:
            print(f"\n🔍 Verification successful:")
            print(f"   Horn Status: {twin_in_db['features']['horn']['properties']['status']['state']}")
            print(f"   Activation Count: {twin_in_db['features']['horn']['properties']['status']['activationCount']}")
            print(f"   Last Activated: {twin_in_db['features']['horn']['properties']['status']['lastActivated']}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error inserting car digital twin: {e}")
        return False

if __name__ == "__main__":
    print("🚗 Car Digital Twin MongoDB Insertion")
    print("=" * 40)
    insert_car_digital_twin()