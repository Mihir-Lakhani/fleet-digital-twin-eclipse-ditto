#!/usr/bin/env python3
"""
MongoDB Car Digital Twin Query Script
This script provides various queries to view the car digital twin data in MongoDB
"""

import pymongo
import json
from datetime import datetime

def query_car_digital_twin():
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client["digitaltwindb"]
        collection = db["things"]
        
        print("🚗 CAR DIGITAL TWIN - MONGODB DATA")
        print("=" * 50)
        
        # Find the car digital twin
        car_twin = collection.find_one({"thingId": "car:horn-car-001"})
        
        if not car_twin:
            print("❌ Car digital twin not found in MongoDB")
            return
        
        # Display basic information
        print(f"\n📋 BASIC INFORMATION:")
        print(f"   Thing ID: {car_twin['thingId']}")
        print(f"   Policy ID: {car_twin['policyId']}")
        print(f"   Definition: {car_twin['definition']}")
        
        # Display metadata
        print(f"\n🏷️  METADATA:")
        metadata = car_twin['attributes']['metadata']
        print(f"   Manufacturer: {metadata['manufacturer']}")
        print(f"   Model: {metadata['model']}")
        print(f"   Version: {metadata['version']}")
        print(f"   Created: {metadata['createdAt']}")
        print(f"   Last Modified: {metadata['lastModified']}")
        
        # Display identification
        print(f"\n🆔 IDENTIFICATION:")
        identification = car_twin['attributes']['identification']
        print(f"   Vehicle ID: {identification['vehicleId']}")
        print(f"   Serial Number: {identification['serialNumber']}")
        print(f"   VIN: {identification['vin']}")
        
        # Display horn status
        print(f"\n📯 HORN STATUS:")
        horn_status = car_twin['features']['horn']['properties']['status']
        print(f"   Current State: {horn_status['state']}")
        print(f"   Last Activated: {horn_status['lastActivated']}")
        print(f"   Activation Count: {horn_status['activationCount']}")
        print(f"   Description: {horn_status['description']}")
        
        # Display horn configuration
        print(f"\n⚙️  HORN CONFIGURATION:")
        horn_config = car_twin['features']['horn']['properties']['configuration']
        print(f"   Enabled: {horn_config['enabled']}")
        print(f"   Volume: {horn_config['volume']}")
        print(f"   Pattern: {horn_config['pattern']}")
        print(f"   Max Duration: {horn_config['maxDuration']}ms")
        
        # Display hardware specs
        print(f"\n🔧 HARDWARE SPECIFICATIONS:")
        hardware = car_twin['features']['horn']['properties']['hardware']
        print(f"   Type: {hardware['type']}")
        print(f"   Pin: {hardware['pin']}")
        print(f"   Voltage: {hardware['voltage']}")
        print(f"   Frequency: {hardware['frequency']}")
        
        # Display MongoDB metadata
        print(f"\n🗄️  MONGODB METADATA:")
        print(f"   Document ID: {car_twin['_id']}")
        print(f"   Created in DB: {car_twin['_created']}")
        print(f"   Modified in DB: {car_twin['_modified']}")
        print(f"   Revision: {car_twin['_metadata']['_revision']}")
        
        # Display raw JSON (truncated)
        print(f"\n📄 RAW JSON PREVIEW (First 500 chars):")
        json_str = json.dumps(car_twin, indent=2, default=str)
        print(f"   {json_str[:500]}...")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error querying car digital twin: {e}")

def query_all_car_related():
    """Query all car-related digital twins"""
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client["digitaltwindb"]
        collection = db["things"]
        
        print(f"\n🔍 ALL CAR-RELATED DIGITAL TWINS:")
        print("=" * 40)
        
        # Find all documents with 'car' in thingId or type
        car_twins = collection.find({
            "$or": [
                {"thingId": {"$regex": "car", "$options": "i"}},
                {"attributes.type": {"$regex": "car", "$options": "i"}},
                {"attributes.specifications.type": {"$regex": "car", "$options": "i"}}
            ]
        })
        
        count = 0
        for twin in car_twins:
            count += 1
            print(f"\n   {count}. Thing ID: {twin['thingId']}")
            if 'attributes' in twin and 'metadata' in twin['attributes']:
                print(f"      Model: {twin['attributes']['metadata'].get('model', 'N/A')}")
            print(f"      Type: {twin.get('attributes', {}).get('type', 'N/A')}")
            
        if count == 0:
            print("   No car-related digital twins found")
        else:
            print(f"\n   Total car-related twins: {count}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error querying car twins: {e}")

if __name__ == "__main__":
    query_car_digital_twin()
    query_all_car_related()