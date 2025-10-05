#!/usr/bin/env python3
"""
Live Car Horn Digital Twin Monitor
Real-time status display for car:horn-car-001
"""

import pymongo
import time
import os
import json
from datetime import datetime
from colorama import init, Fore, Back, Style

# Initialize colorama for Windows
init()

class LiveHornMonitor:
    def __init__(self):
        self.client = pymongo.MongoClient("mongodb://localhost:27017/")
        self.db = self.client.digitaltwindb
        self.collection = self.db.things
        self.thing_id = "car:horn-car-001"
        self.last_activation_count = None
        self.last_state = None
        
    def clear_screen(self):
        os.system('cls' if os.name == 'nt' else 'clear')
        
    def get_horn_status(self):
        """Get current horn status from MongoDB"""
        try:
            result = self.collection.find_one(
                {"thingId": self.thing_id},
                {
                    "features.horn": 1,
                    "attributes.metadata.lastModified": 1,
                    "_modified": 1,
                    "_id": 0
                }
            )
            return result
        except Exception as e:
            print(f"Error fetching data: {e}")
            return None
            
    def format_timestamp(self, timestamp_str):
        """Format timestamp for display"""
        try:
            if timestamp_str:
                dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                return dt.strftime("%Y-%m-%d %H:%M:%S UTC")
        except:
            pass
        return "N/A"
        
    def print_header(self, data=None):
        """Print the header with styling and key metrics"""
        print(f"{Back.BLUE}{Fore.WHITE} 🚗 CAR HORN DIGITAL TWIN - LIVE MONITOR 🚗 {Style.RESET_ALL}")
        print(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Thing ID: {Fore.WHITE}{self.thing_id}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Monitor Started: {Fore.WHITE}{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}")
        
        # Show current key metrics in header if data available
        if data and 'features' in data and 'horn' in data['features'] and 'properties' in data['features']['horn']:
            properties = data['features']['horn']['properties']
            if 'status' in properties:
                status = properties['status']
                state = status.get('state', 'UNKNOWN')
                activation_count = status.get('activationCount', 0)
                
                state_color = Fore.GREEN if state == 'ON' else Fore.WHITE if state == 'OFF' else Fore.RED
                
                print(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════{Style.RESET_ALL}")
                print(f"{Fore.MAGENTA}🔥 LIVE STATUS: {state_color}{Style.BRIGHT}{state}{Style.RESET_ALL} | "
                      f"{Fore.MAGENTA}🔢 TOTAL ACTIVATIONS: {Fore.YELLOW}{Style.BRIGHT}{activation_count}{Style.RESET_ALL}")
        
        print(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════{Style.RESET_ALL}")
        
    def print_status(self, data):
        """Print the current status with colors"""
        if not data or 'features' not in data or 'horn' not in data['features']:
            print(f"{Fore.RED}❌ No horn feature data found{Style.RESET_ALL}")
            return
            
        horn = data['features']['horn']
        
        # Get properties section (this is where the actual data is)
        if 'properties' not in horn:
            print(f"{Fore.RED}❌ No horn properties found{Style.RESET_ALL}")
            return
            
        properties = horn['properties']
        
        # Status section
        if 'status' in properties:
            status = properties['status']
            state = status.get('state', 'UNKNOWN')
            activation_count = status.get('activationCount', 0)
            last_activated = status.get('lastActivated', 'Never')
            description = status.get('description', '')
            
            # Color based on state
            state_color = Fore.GREEN if state == 'ON' else Fore.WHITE if state == 'OFF' else Fore.RED
            
            print(f"\n{Fore.CYAN}📊 HORN STATUS:{Style.RESET_ALL}")
            print(f"  State: {state_color}{Style.BRIGHT}{state}{Style.RESET_ALL}")
            print(f"  {Fore.YELLOW}🔢 Activation Count: {Style.BRIGHT}{Fore.WHITE}{activation_count}{Style.RESET_ALL}")
            print(f"  Last Activated: {Fore.WHITE}{self.format_timestamp(last_activated)}{Style.RESET_ALL}")
            if description:
                print(f"  Description: {Fore.CYAN}{description}{Style.RESET_ALL}")
            
            # Check for changes
            if self.last_activation_count is not None:
                if activation_count > self.last_activation_count:
                    print(f"  {Back.GREEN}{Fore.WHITE}🔔 NEW ACTIVATION DETECTED! Count: {self.last_activation_count} → {activation_count} 🔔{Style.RESET_ALL}")
                if state != self.last_state:
                    print(f"  {Back.YELLOW}{Fore.BLACK}🔄 STATE CHANGED: {self.last_state} → {state}{Style.RESET_ALL}")
                    
            self.last_activation_count = activation_count
            self.last_state = state
            
        # Configuration section
        if 'configuration' in properties:
            config = properties['configuration']
            print(f"\n{Fore.CYAN}⚙️  CONFIGURATION:{Style.RESET_ALL}")
            print(f"  Enabled: {Fore.GREEN if config.get('enabled') else Fore.RED}{config.get('enabled', 'Unknown')}{Style.RESET_ALL}")
            print(f"  Volume: {Fore.WHITE}{config.get('volume', 'Unknown')}{Style.RESET_ALL}")
            print(f"  Pattern: {Fore.WHITE}{config.get('pattern', 'Unknown')}{Style.RESET_ALL}")
            print(f"  Max Duration: {Fore.WHITE}{config.get('maxDuration', 'Unknown')} ms{Style.RESET_ALL}")
            
        # Hardware section
        if 'hardware' in properties:
            hardware = properties['hardware']
            print(f"\n{Fore.CYAN}🔧 HARDWARE:{Style.RESET_ALL}")
            print(f"  Type: {Fore.WHITE}{hardware.get('type', 'Unknown')}{Style.RESET_ALL}")
            print(f"  Pin: {Fore.WHITE}{hardware.get('pin', 'Unknown')}{Style.RESET_ALL}")
            print(f"  Voltage: {Fore.WHITE}{hardware.get('voltage', 'Unknown')}{Style.RESET_ALL}")
            print(f"  Frequency: {Fore.WHITE}{hardware.get('frequency', 'Unknown')}{Style.RESET_ALL}")
            
        # Metadata
        if 'attributes' in data and 'metadata' in data['attributes']:
            last_modified = data['attributes']['metadata'].get('lastModified', 'Unknown')
            print(f"\n{Fore.CYAN}📝 METADATA:{Style.RESET_ALL}")
            print(f"  Last Modified: {Fore.WHITE}{self.format_timestamp(last_modified)}{Style.RESET_ALL}")
            
        # Database timestamp
        if '_modified' in data:
            db_modified = data.get('_modified', 'Unknown')
            print(f"  DB Modified: {Fore.WHITE}{self.format_timestamp(str(db_modified))}{Style.RESET_ALL}")
            
    def run(self):
        """Run the live monitor"""
        print(f"{Fore.GREEN}Starting Live Horn Monitor...{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Press Ctrl+C to stop{Style.RESET_ALL}\n")
        
        try:
            while True:
                # Get current data
                data = self.get_horn_status()
                
                self.clear_screen()
                self.print_header(data)
                self.print_status(data)
                
                # Footer
                print(f"\n{Fore.CYAN}═══════════════════════════════════════════════════════════════{Style.RESET_ALL}")
                print(f"{Fore.MAGENTA}🔄 Refreshing every 2 seconds... Press Ctrl+C to stop{Style.RESET_ALL}")
                
                time.sleep(2)
                
        except KeyboardInterrupt:
            print(f"\n\n{Fore.GREEN}Monitor stopped by user{Style.RESET_ALL}")
        except Exception as e:
            print(f"\n\n{Fore.RED}Error: {e}{Style.RESET_ALL}")
        finally:
            self.client.close()

if __name__ == "__main__":
    monitor = LiveHornMonitor()
    monitor.run()