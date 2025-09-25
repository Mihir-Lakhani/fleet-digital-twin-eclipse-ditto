#!/usr/bin/env python3
"""
MongoDB Thing Management - Demo Script
=====================================

This script demonstrates all CRUD operations for the MongoDB Thing Management system.
It creates, reads, updates, and deletes digital twins using the enhanced API.

Requirements:
- requests library: pip install requests
- Running Digital Twin platform on localhost:5000

Author: Digital Twin Platform
Date: September 24, 2025
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

class ThingManager:
    """Client for MongoDB Thing Management API"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url.rstrip('/')
        self.endpoint = f"{self.base_url}/mongodb/things"
        
    def create_thing(self, thing_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new Thing"""
        try:
            response = requests.post(self.endpoint, json=thing_data)
            if response.status_code == 201:
                return response.json()
            else:
                print(f"❌ Failed to create Thing: {response.status_code}")
                print(response.text)
                return None
        except Exception as e:
            print(f"❌ Error creating Thing: {e}")
            return None
    
    def list_things(self) -> Optional[Dict[str, Any]]:
        """List all Things"""
        try:
            response = requests.get(self.endpoint)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Failed to list Things: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error listing Things: {e}")
            return None
    
    def get_thing(self, thing_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific Thing by ID"""
        try:
            response = requests.get(f"{self.endpoint}/{thing_id}")
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                print(f"🔍 Thing not found: {thing_id}")
                return None
            else:
                print(f"❌ Failed to get Thing: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error getting Thing: {e}")
            return None
    
    def update_thing(self, thing_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a Thing (partial update)"""
        try:
            response = requests.patch(f"{self.endpoint}/{thing_id}", json=update_data)
            if response.status_code == 204:
                return True
            elif response.status_code == 404:
                print(f"🔍 Thing not found for update: {thing_id}")
                return False
            else:
                print(f"❌ Failed to update Thing: {response.status_code}")
                print(response.text)
                return False
        except Exception as e:
            print(f"❌ Error updating Thing: {e}")
            return False
    
    def replace_thing(self, thing_id: str, thing_data: Dict[str, Any]) -> bool:
        """Replace a Thing completely (PUT)"""
        try:
            response = requests.put(f"{self.endpoint}/{thing_id}", json=thing_data)
            if response.status_code in [201, 204]:
                return True
            else:
                print(f"❌ Failed to replace Thing: {response.status_code}")
                print(response.text)
                return False
        except Exception as e:
            print(f"❌ Error replacing Thing: {e}")
            return False
    
    def delete_thing(self, thing_id: str) -> bool:
        """Delete a Thing"""
        try:
            response = requests.delete(f"{self.endpoint}/{thing_id}")
            if response.status_code == 204:
                return True
            elif response.status_code == 404:
                print(f"🔍 Thing not found for deletion: {thing_id}")
                return False
            else:
                print(f"❌ Failed to delete Thing: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error deleting Thing: {e}")
            return False

def demo_vehicle_management():
    """Demonstrate vehicle digital twin management"""
    print("\n🚗 VEHICLE DIGITAL TWIN DEMO")
    print("=" * 50)
    
    manager = ThingManager()
    
    # 1. Create a vehicle
    print("\n1️⃣ Creating Tesla Model S...")
    vehicle_data = {
        "thingId": "vehicle:demo_tesla_001",
        "definition": "org.eclipse.ditto:vehicle:1.0.0",
        "attributes": {
            "manufacturer": "Tesla",
            "model": "Model S Plaid",
            "year": 2024,
            "vin": "5YJS3E1EA6NF123456",
            "color": "Pearl White",
            "owner": "Fleet Demo Corp"
        },
        "features": {
            "gps": {
                "properties": {
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "speed": 0.0,
                    "heading": 0.0,
                    "altitude": 52.0,
                    "timestamp": datetime.now().isoformat() + "Z"
                }
            },
            "engine": {
                "properties": {
                    "running": False,
                    "battery_level": 95.8,
                    "range_remaining": 396,
                    "charging": True,
                    "charge_rate": 250.0,
                    "temperature": 22.5
                }
            },
            "security": {
                "properties": {
                    "locked": True,
                    "alarm_active": False,
                    "windows_closed": True,
                    "last_unlock": "2025-09-24T20:00:00Z"
                }
            },
            "climate": {
                "properties": {
                    "interior_temp": 21.0,
                    "target_temp": 22.0,
                    "hvac_on": True,
                    "defrost_on": False
                }
            }
        }
    }
    
    vehicle = manager.create_thing(vehicle_data)
    if vehicle:
        print(f"✅ Created vehicle: {vehicle['thingId']}")
        print(f"📍 Location: {vehicle['features']['gps']['properties']['latitude']}, {vehicle['features']['gps']['properties']['longitude']}")
        print(f"🔋 Battery: {vehicle['features']['engine']['properties']['battery_level']}%")
        print(f"📈 Revision: {vehicle['_revision']}")
    
    time.sleep(1)
    
    # 2. Start the vehicle and drive
    print("\n2️⃣ Starting vehicle and driving...")
    driving_update = {
        "features": {
            "engine": {
                "properties": {
                    "running": True,
                    "charging": False,
                    "battery_level": 94.2,
                    "range_remaining": 385
                }
            },
            "gps": {
                "properties": {
                    "latitude": 37.7849,
                    "longitude": -122.4094,
                    "speed": 35.0,
                    "heading": 45.0,
                    "timestamp": datetime.now().isoformat() + "Z"
                }
            },
            "security": {
                "properties": {
                    "locked": False
                }
            }
        }
    }
    
    if manager.update_thing("vehicle:demo_tesla_001", driving_update):
        print("✅ Vehicle started and location updated")
        
        # Get updated vehicle data
        updated_vehicle = manager.get_thing("vehicle:demo_tesla_001")
        if updated_vehicle:
            gps = updated_vehicle['features']['gps']['properties']
            engine = updated_vehicle['features']['engine']['properties']
            print(f"📍 New location: {gps['latitude']}, {gps['longitude']}")
            print(f"🏃 Speed: {gps['speed']} mph")
            print(f"🔋 Battery: {engine['battery_level']}% (Range: {engine['range_remaining']} mi)")
            print(f"📈 Revision: {updated_vehicle['_revision']}")
    
    time.sleep(1)
    
    # 3. Arrive at destination and park
    print("\n3️⃣ Arriving at destination and parking...")
    parking_update = {
        "features": {
            "engine": {
                "properties": {
                    "running": False,
                    "battery_level": 91.5,
                    "range_remaining": 374,
                    "charging": True,
                    "charge_rate": 150.0
                }
            },
            "gps": {
                "properties": {
                    "latitude": 37.7949,
                    "longitude": -122.3994,
                    "speed": 0.0,
                    "heading": 90.0,
                    "timestamp": datetime.now().isoformat() + "Z"
                }
            },
            "security": {
                "properties": {
                    "locked": True,
                    "last_lock": datetime.now().isoformat() + "Z"
                }
            }
        }
    }
    
    if manager.update_thing("vehicle:demo_tesla_001", parking_update):
        print("✅ Vehicle parked and charging")
        
    return "vehicle:demo_tesla_001"

def demo_sensor_management():
    """Demonstrate IoT sensor management"""
    print("\n📡 IOT SENSOR DEMO")
    print("=" * 50)
    
    manager = ThingManager()
    
    # 1. Create temperature sensors
    sensors = []
    locations = [
        {"id": "temp_office_301", "location": "Office Building A", "floor": 3, "room": "301"},
        {"id": "temp_lobby_main", "location": "Office Building A", "floor": 1, "room": "Main Lobby"},
        {"id": "temp_server_room", "location": "Data Center", "floor": 1, "room": "Server Room"}
    ]
    
    print("\n1️⃣ Creating temperature sensors...")
    for loc in locations:
        sensor_data = {
            "thingId": f"sensor:{loc['id']}",
            "definition": "org.eclipse.ditto:sensor:1.0.0",
            "attributes": {
                "type": "temperature_humidity",
                "location": loc["location"],
                "floor": loc["floor"],
                "room": loc["room"],
                "installed_date": "2025-01-15",
                "maintenance_interval": "quarterly",
                "manufacturer": "Bosch",
                "model": "BME280"
            },
            "features": {
                "temperature": {
                    "properties": {
                        "value": round(20.0 + (loc["floor"] * 1.5), 1),
                        "unit": "celsius",
                        "accuracy": 0.1,
                        "timestamp": datetime.now().isoformat() + "Z",
                        "status": "normal",
                        "threshold_min": 18.0,
                        "threshold_max": 28.0
                    }
                },
                "humidity": {
                    "properties": {
                        "value": round(40.0 + (loc["floor"] * 3.2), 1),
                        "unit": "percent",
                        "accuracy": 2.0,
                        "timestamp": datetime.now().isoformat() + "Z",
                        "status": "normal"
                    }
                },
                "connectivity": {
                    "properties": {
                        "wifi_strength": -45 - (loc["floor"] * 5),
                        "battery_level": 85,
                        "last_ping": datetime.now().isoformat() + "Z",
                        "firmware_version": "2.1.3"
                    }
                }
            }
        }
        
        sensor = manager.create_thing(sensor_data)
        if sensor:
            sensors.append(sensor['thingId'])
            temp = sensor['features']['temperature']['properties']['value']
            humidity = sensor['features']['humidity']['properties']['value']
            print(f"✅ Created {sensor['thingId']}: {temp}°C, {humidity}% humidity")
    
    time.sleep(1)
    
    # 2. Simulate sensor readings update
    print("\n2️⃣ Updating sensor readings...")
    for sensor_id in sensors:
        # Simulate temperature change
        import random
        temp_change = random.uniform(-2.0, 3.0)
        humidity_change = random.uniform(-5.0, 5.0)
        
        current_sensor = manager.get_thing(sensor_id)
        if current_sensor:
            current_temp = current_sensor['features']['temperature']['properties']['value']
            current_humidity = current_sensor['features']['humidity']['properties']['value']
            
            new_temp = round(current_temp + temp_change, 1)
            new_humidity = round(max(20.0, min(80.0, current_humidity + humidity_change)), 1)
            
            update_data = {
                "features": {
                    "temperature": {
                        "properties": {
                            "value": new_temp,
                            "timestamp": datetime.now().isoformat() + "Z",
                            "status": "high" if new_temp > 26.0 else "normal"
                        }
                    },
                    "humidity": {
                        "properties": {
                            "value": new_humidity,
                            "timestamp": datetime.now().isoformat() + "Z"
                        }
                    }
                }
            }
            
            if manager.update_thing(sensor_id, update_data):
                status = "🔥" if new_temp > 26.0 else "❄️" if new_temp < 19.0 else "🌡️"
                print(f"{status} {sensor_id}: {new_temp}°C, {new_humidity}% humidity")
    
    return sensors

def demo_list_and_cleanup():
    """List all things and cleanup demo data"""
    print("\n📋 LISTING ALL THINGS")
    print("=" * 50)
    
    manager = ThingManager()
    
    # List all things
    data = manager.list_things()
    if data:
        print(f"\n📊 Total Things: {data['count']}")
        print(f"📦 Source: {data['source']}")
        
        # Group by type
        vehicles = []
        sensors = []
        others = []
        
        for thing in data['things']:
            thing_id = thing['thingId']
            if thing_id.startswith('vehicle:'):
                vehicles.append(thing)
            elif thing_id.startswith('sensor:'):
                sensors.append(thing)
            else:
                others.append(thing)
        
        # Display vehicles
        if vehicles:
            print(f"\n🚗 Vehicles ({len(vehicles)}):")
            for vehicle in vehicles:
                attrs = vehicle.get('attributes', {})
                battery = vehicle.get('features', {}).get('engine', {}).get('properties', {}).get('battery_level', 'N/A')
                location = vehicle.get('features', {}).get('gps', {}).get('properties', {})
                lat, lon = location.get('latitude', 'N/A'), location.get('longitude', 'N/A')
                print(f"  • {vehicle['thingId']}")
                print(f"    {attrs.get('manufacturer', 'Unknown')} {attrs.get('model', '')} ({attrs.get('year', 'N/A')})")
                print(f"    🔋 Battery: {battery}% | 📍 Location: {lat}, {lon}")
                print(f"    📈 Revision: {vehicle['_revision']} | 🕒 Modified: {vehicle['_modified']}")
        
        # Display sensors
        if sensors:
            print(f"\n📡 Sensors ({len(sensors)}):")
            for sensor in sensors:
                attrs = sensor.get('attributes', {})
                temp = sensor.get('features', {}).get('temperature', {}).get('properties', {}).get('value', 'N/A')
                humidity = sensor.get('features', {}).get('humidity', {}).get('properties', {}).get('value', 'N/A')
                print(f"  • {sensor['thingId']}")
                print(f"    📍 {attrs.get('location', 'Unknown')} - Floor {attrs.get('floor', 'N/A')}, {attrs.get('room', 'N/A')}")
                print(f"    🌡️ {temp}°C | 💧 {humidity}% humidity")
                print(f"    📈 Revision: {sensor['_revision']} | 🕒 Modified: {sensor['_modified']}")
        
        # Display others
        if others:
            print(f"\n🔧 Other Things ({len(others)}):")
            for thing in others:
                print(f"  • {thing['thingId']} (Rev: {thing['_revision']})")
    
    # Cleanup demo data
    print(f"\n🧹 CLEANUP DEMO DATA")
    print("=" * 30)
    
    demo_things = [
        "vehicle:demo_tesla_001",
        "sensor:temp_office_301",
        "sensor:temp_lobby_main",
        "sensor:temp_server_room"
    ]
    
    for thing_id in demo_things:
        if manager.delete_thing(thing_id):
            print(f"🗑️ Deleted: {thing_id}")
    
    # Final count
    final_data = manager.list_things()
    if final_data:
        print(f"\n📊 Remaining Things: {final_data['count']}")

def main():
    """Main demo function"""
    print("🚀 MONGODB THING MANAGEMENT DEMO")
    print("=" * 60)
    print("This demo showcases the complete CRUD operations")
    print("for digital twins using the MongoDB Thing Management API.")
    print("=" * 60)
    
    try:
        # Test connection
        response = requests.get("http://localhost:5000/")
        if response.status_code != 200:
            print("❌ Cannot connect to Digital Twin platform at http://localhost:5000")
            print("Please ensure the platform is running with: docker-compose -f docker-compose-final.yaml up -d")
            return
        
        print("✅ Connected to Digital Twin platform")
        
        # Run demos
        vehicle_id = demo_vehicle_management()
        sensor_ids = demo_sensor_management()
        demo_list_and_cleanup()
        
        print("\n🎉 DEMO COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("📚 For more examples and documentation:")
        print("   • API Docs: http://localhost:5000/api/docs")
        print("   • Health Check: http://localhost:5000/test-connections")
        print("   • Quick Reference: docs/QUICK_REFERENCE.md")
        print("   • Full Guide: docs/MONGODB_THING_MANAGEMENT.md")
        
    except requests.ConnectionError:
        print("❌ Cannot connect to Digital Twin platform")
        print("Please ensure the platform is running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Demo failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()