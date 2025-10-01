#!/usr/bin/env python3
"""
Integrated Car Digital Twin with Arduino Horn Controller

This application combines the digital twin management system with the Arduino
buzzer controller to create a complete digital twin solution for a car with
horn functionality.

Features:
- Digital twin JSON management
- Real-time hardware control via Arduino
- Bidirectional synchronization between digital twin and physical hardware
- Comprehensive GUI with both digital and physical controls
"""

import json
import os
import datetime
import time
from typing import Dict, Any, Optional
import tkinter as tk
from tkinter import ttk, messagebox
import serial
import serial.tools.list_ports
import threading
import pymongo
from pymongo import MongoClient


class CarDigitalTwin:
    """Digital Twin representation of a car with horn functionality - MongoDB Primary Storage"""
    
    def __init__(self, thing_id: str = "car:horn-car-001", mongo_uri: str = "mongodb://localhost:27017/", db_name: str = "digitaltwindb"):
        self.thing_id = thing_id
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.collection_name = "things"
        self.client = None
        self.db = None
        self.collection = None
        self.data = {}
        self.connect_to_mongodb()
        self.load_digital_twin()
    
    def connect_to_mongodb(self) -> bool:
        """Establish connection to MongoDB"""
        try:
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client[self.db_name]
            self.collection = self.db[self.collection_name]
            # Test connection
            self.client.admin.command('ping')
            print(f"✅ Connected to MongoDB: {self.db_name}")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def load_digital_twin(self) -> bool:
        """Load digital twin data from MongoDB"""
        try:
            if self.collection is None:
                print("❌ MongoDB connection not established")
                return False
                
            document = self.collection.find_one({"thingId": self.thing_id})
            if document:
                self.data = document
                print(f"✅ Loaded digital twin from MongoDB: {self.thing_id}")
                return True
            else:
                print(f"❌ Digital twin not found in MongoDB: {self.thing_id}")
                return False
        except Exception as e:
            print(f"❌ Error loading digital twin from MongoDB: {e}")
            return False
    
    def save_digital_twin(self) -> bool:
        """Save digital twin data to MongoDB"""
        try:
            if self.collection is None:
                print("❌ MongoDB connection not established")
                return False
            
            # Update metadata
            now = datetime.datetime.now().isoformat() + "Z"
            self.data["_modified"] = now
            self.data["_metadata"]["modified"] = now
            self.data["_metadata"]["_revision"] = self.data["_metadata"].get("_revision", 1) + 1
            self.data["attributes"]["metadata"]["lastModified"] = now
            
            # Update or insert document
            result = self.collection.replace_one(
                {"thingId": self.thing_id}, 
                self.data, 
                upsert=True
            )
            
            if result.modified_count > 0 or result.upserted_id:
                print(f"✅ Saved digital twin to MongoDB: {self.thing_id}")
                return True
            else:
                print(f"⚠️ No changes made to digital twin: {self.thing_id}")
                return True
                
        except Exception as e:
            print(f"❌ Error saving digital twin to MongoDB: {e}")
            return False
    
    def close_connection(self):
        """Close MongoDB connection"""
        try:
            if self.client:
                self.client.close()
                print("✅ MongoDB connection closed")
        except Exception as e:
            print(f"❌ Error closing MongoDB connection: {e}")
    
    def get_horn_status(self) -> str:
        """Get current horn status"""
        try:
            return self.data["features"]["horn"]["properties"]["status"]["state"]
        except KeyError:
            return "UNKNOWN"
    
    def set_horn_status(self, status: str) -> bool:
        """Set horn status and update related properties"""
        try:
            horn_props = self.data["features"]["horn"]["properties"]["status"]
            
            # Update status
            horn_props["state"] = status
            
            # If turning ON, update activation timestamp and count
            if status == "ON":
                horn_props["lastActivated"] = datetime.datetime.now().isoformat() + "Z"
                horn_props["activationCount"] = horn_props.get("activationCount", 0) + 1
            
            return self.save_digital_twin()
        except Exception as e:
            print(f"❌ Error setting horn status: {e}")
            return False
    
    def get_horn_statistics(self) -> Dict[str, Any]:
        """Get horn usage statistics"""
        try:
            status_props = self.data["features"]["horn"]["properties"]["status"]
            return {
                "activationCount": status_props.get("activationCount", 0),
                "lastActivated": status_props.get("lastActivated"),
                "currentState": status_props.get("state", "OFF")
            }
        except KeyError:
            return {"activationCount": 0, "lastActivated": None, "currentState": "OFF"}
    
    def get_thing_info(self) -> Dict[str, Any]:
        """Get basic thing information"""
        try:
            return {
                "thingId": self.data.get("thingId", "unknown"),
                "manufacturer": self.data["attributes"]["metadata"]["manufacturer"],
                "model": self.data["attributes"]["metadata"]["model"],
                "version": self.data["attributes"]["metadata"]["version"],
                "vehicleId": self.data["attributes"]["identification"]["vehicleId"],
                "features": self.data["attributes"]["specifications"]["features"]
            }
        except KeyError:
            return {}


class IntegratedCarController:
    """Integrated controller combining digital twin and Arduino hardware control"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("Integrated Car Digital Twin - Horn Controller")
        self.root.geometry("700x600")
        self.root.resizable(False, False)
        
        # Digital Twin
        self.digital_twin = CarDigitalTwin()
        
        # Arduino/Serial connection variables
        self.serial_connection = None
        self.connected = False
        # Note: hardware_horn_state tracks the last known state of the physical hardware
        # It's synchronized with actual hardware state upon connection
        self.hardware_horn_state = False
        
        # Create GUI
        self.create_widgets()
        
        # Initialize displays
        self.update_digital_twin_display()
        self.refresh_com_ports()
        
        # Add initial log messages
        self.log_message("Car Digital Twin Controller started.")
        self.log_message("Use Digital Twin tab for virtual control.")
        self.log_message("Use Hardware Control tab for Arduino connection.")
        
        # Configure window close event
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
    
    def create_widgets(self):
        """Create and arrange GUI widgets"""
        
        # Main notebook for tabs
        notebook = ttk.Notebook(self.root)
        notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Digital Twin tab
        dt_frame = ttk.Frame(notebook)
        notebook.add(dt_frame, text="Digital Twin")
        
        # Hardware Control tab
        hw_frame = ttk.Frame(notebook)
        notebook.add(hw_frame, text="Hardware Control")
        
        self.create_digital_twin_tab(dt_frame)
        self.create_hardware_tab(hw_frame)
    
    def create_digital_twin_tab(self, parent):
        """Create digital twin information and control tab"""
        
        # Thing Information frame
        info_frame = ttk.LabelFrame(parent, text="Digital Twin Information", padding="10")
        info_frame.pack(fill=tk.X, padx=10, pady=(10, 5))
        
        # Thing info labels
        self.thing_info_labels = {}
        info_fields = [
            ("Thing ID:", "thingId"),
            ("Manufacturer:", "manufacturer"),
            ("Model:", "model"),
            ("Vehicle ID:", "vehicleId"),
            ("Features:", "features")
        ]
        
        for i, (label_text, field) in enumerate(info_fields):
            ttk.Label(info_frame, text=label_text).grid(row=i, column=0, sticky=tk.W, pady=2)
            label = ttk.Label(info_frame, text="", foreground="blue")
            label.grid(row=i, column=1, sticky=tk.W, padx=(10, 0), pady=2)
            self.thing_info_labels[field] = label
        
        # Horn Status frame
        status_frame = ttk.LabelFrame(parent, text="Digital Twin Horn Status", padding="10")
        status_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Current status
        ttk.Label(status_frame, text="Current State:").grid(row=0, column=0, sticky=tk.W)
        self.dt_horn_status = ttk.Label(status_frame, text="OFF", foreground="red", font=("Arial", 12, "bold"))
        self.dt_horn_status.grid(row=0, column=1, sticky=tk.W, padx=(10, 0))
        
        # Control buttons
        button_frame = ttk.Frame(status_frame)
        button_frame.grid(row=1, column=0, columnspan=2, pady=(10, 0), sticky=(tk.W, tk.E))
        
        self.dt_on_btn = ttk.Button(button_frame, text="Activate Horn (DT + Hardware)", 
                                   command=self.activate_horn_dt_only)
        self.dt_on_btn.pack(side=tk.LEFT, padx=(0, 5))
        
        self.dt_off_btn = ttk.Button(button_frame, text="Deactivate Horn (DT + Hardware)", 
                                    command=self.deactivate_horn_dt_only)
        self.dt_off_btn.pack(side=tk.LEFT, padx=5)
        
        # Statistics frame
        stats_frame = ttk.LabelFrame(parent, text="Horn Usage Statistics", padding="10")
        stats_frame.pack(fill=tk.X, padx=10, pady=5)
        
        self.stats_labels = {}
        stats_fields = [
            ("Activation Count:", "activationCount"),
            ("Last Activated:", "lastActivated")
        ]
        
        for i, (label_text, field) in enumerate(stats_fields):
            ttk.Label(stats_frame, text=label_text).grid(row=i, column=0, sticky=tk.W, pady=2)
            label = ttk.Label(stats_frame, text="", foreground="green")
            label.grid(row=i, column=1, sticky=tk.W, padx=(10, 0), pady=2)
            self.stats_labels[field] = label
        
        # Refresh button
        ttk.Button(parent, text="Refresh Digital Twin Data", 
                  command=self.refresh_digital_twin).pack(pady=10)
        
        # Activity log
        log_frame = ttk.LabelFrame(parent, text="Activity Log", padding="10")
        log_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Log text widget with scrollbar
        self.dt_log_text = tk.Text(log_frame, height=6, width=50, wrap=tk.WORD)
        dt_scrollbar = ttk.Scrollbar(log_frame, orient="vertical", command=self.dt_log_text.yview)
        self.dt_log_text.configure(yscrollcommand=dt_scrollbar.set)
        
        self.dt_log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        dt_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    
    def create_hardware_tab(self, parent):
        """Create hardware control tab"""
        
        # COM Port selection frame
        port_frame = ttk.LabelFrame(parent, text="Arduino Connection", padding="10")
        port_frame.pack(fill=tk.X, padx=10, pady=(10, 5))
        
        # COM Port dropdown
        ttk.Label(port_frame, text="COM Port:").grid(row=0, column=0, sticky=tk.W, padx=(0, 5))
        self.port_var = tk.StringVar()
        self.port_combo = ttk.Combobox(port_frame, textvariable=self.port_var, width=15, state="readonly")
        self.port_combo.grid(row=0, column=1, padx=(0, 5))
        
        # Refresh ports button
        self.refresh_btn = ttk.Button(port_frame, text="Refresh", command=self.refresh_com_ports)
        self.refresh_btn.grid(row=0, column=2, padx=(5, 0))
        
        # Connect/Disconnect button
        self.connect_btn = ttk.Button(port_frame, text="Connect", command=self.toggle_connection)
        self.connect_btn.grid(row=1, column=0, columnspan=3, pady=(10, 0), sticky=(tk.W, tk.E))
        
        # Hardware control frame
        hw_control_frame = ttk.LabelFrame(parent, text="Hardware Horn Control", padding="10")
        hw_control_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Hardware status
        ttk.Label(hw_control_frame, text="Hardware State:").grid(row=0, column=0, sticky=tk.W)
        self.hw_horn_status = ttk.Label(hw_control_frame, text="OFF", foreground="red", font=("Arial", 12, "bold"))
        self.hw_horn_status.grid(row=0, column=1, sticky=tk.W, padx=(10, 0))
        
        # Hardware control buttons
        hw_button_frame = ttk.Frame(hw_control_frame)
        hw_button_frame.grid(row=1, column=0, columnspan=2, pady=(10, 0), sticky=(tk.W, tk.E))
        
        self.hw_on_btn = ttk.Button(hw_button_frame, text="Turn Horn ON (Hardware + DT)", 
                                   command=self.turn_horn_on_hw_only, state="disabled")
        self.hw_on_btn.pack(side=tk.LEFT, padx=(0, 5))
        
        self.hw_off_btn = ttk.Button(hw_button_frame, text="Turn Horn OFF (Hardware + DT)", 
                                    command=self.turn_horn_off_hw_only, state="disabled")
        self.hw_off_btn.pack(side=tk.LEFT, padx=5)
        
        # Connection status
        status_frame = ttk.LabelFrame(parent, text="Connection Status", padding="10")
        status_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(status_frame, text="Arduino Connection:").grid(row=0, column=0, sticky=tk.W)
        self.connection_status = ttk.Label(status_frame, text="Disconnected", foreground="red")
        self.connection_status.grid(row=0, column=1, sticky=tk.W, padx=(10, 0))
        
        # Activity log for hardware tab
        hw_log_frame = ttk.LabelFrame(parent, text="Activity Log", padding="10")
        hw_log_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Log text widget with scrollbar
        self.hw_log_text = tk.Text(hw_log_frame, height=6, width=50, wrap=tk.WORD)
        hw_scrollbar = ttk.Scrollbar(hw_log_frame, orient="vertical", command=self.hw_log_text.yview)
        self.hw_log_text.configure(yscrollcommand=hw_scrollbar.set)
        
        self.hw_log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        hw_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    
    # Arduino/Hardware Methods
    def refresh_com_ports(self):
        """Refresh the list of available COM ports"""
        ports = serial.tools.list_ports.comports()
        port_names = [port.device for port in ports]
        
        self.port_combo['values'] = port_names
        
        if port_names:
            if self.port_var.get() not in port_names:
                self.port_var.set(port_names[0])
            self.log_message(f"Found {len(port_names)} COM port(s): {', '.join(port_names)}")
        else:
            self.port_var.set("")
            self.log_message("No COM ports found. Please check your Arduino connection.")
    
    def toggle_connection(self):
        """Toggle serial connection to Arduino"""
        if self.connected:
            self.disconnect_arduino()
        else:
            self.connect_arduino()
    
    def connect_arduino(self):
        """Establish serial connection to Arduino"""
        selected_port = self.port_var.get()
        
        if not selected_port:
            messagebox.showerror("Error", "Please select a COM port first.")
            return
        
        try:
            self.serial_connection = serial.Serial(
                port=selected_port,
                baudrate=9600,
                timeout=1,
                write_timeout=1
            )
            
            # Wait a moment for Arduino to initialize
            time.sleep(2)
            
            self.connected = True
            
            # Sync hardware to match Digital Twin state upon connection
            dt_state = self.digital_twin.get_horn_status()
            if dt_state == "ON":
                if self.send_command('1'):
                    self.hardware_horn_state = True
                    self.log_message("Synced hardware to Digital Twin state: Horn ON")
                else:
                    self.hardware_horn_state = False
                    self.log_message("Failed to sync hardware - assuming OFF")
            else:
                if self.send_command('0'):
                    self.hardware_horn_state = False
                    self.log_message("Synced hardware to Digital Twin state: Horn OFF")
                else:
                    self.hardware_horn_state = False
                    self.log_message("Failed to sync hardware - assuming OFF")
            
            # Update UI
            self.connection_status.config(text="Connected", foreground="green")
            self.connect_btn.config(text="Disconnect")
            self.hw_on_btn.config(state="normal")
            self.hw_off_btn.config(state="normal")
            self.port_combo.config(state="disabled")
            self.refresh_btn.config(state="disabled")
            
            # Update hardware status display based on assumed state
            hw_state_text = "ON" if self.hardware_horn_state else "OFF"
            hw_state_color = "green" if self.hardware_horn_state else "red"
            self.hw_horn_status.config(text=hw_state_text, foreground=hw_state_color)
            
            self.log_message(f"Successfully connected to {selected_port} at 9600 baud.")
            
        except serial.SerialException as e:
            messagebox.showerror("Connection Error", f"Failed to connect to {selected_port}:\n{str(e)}")
            self.log_message(f"Connection failed: {str(e)}")
        except Exception as e:
            messagebox.showerror("Unexpected Error", f"An unexpected error occurred:\n{str(e)}")
            self.log_message(f"Unexpected error: {str(e)}")
    
    def disconnect_arduino(self):
        """Close serial connection to Arduino"""
        try:
            if self.serial_connection and self.serial_connection.is_open:
                self.serial_connection.close()
            
            self.connected = False
            # Note: Don't reset hardware_horn_state as hardware maintains its physical state
            
            # Update UI
            self.connection_status.config(text="Disconnected", foreground="red")
            self.hw_horn_status.config(text="Unknown", foreground="orange")
            self.connect_btn.config(text="Connect")
            self.hw_on_btn.config(state="disabled")
            self.hw_off_btn.config(state="disabled")
            self.port_combo.config(state="readonly")
            self.refresh_btn.config(state="normal")
            
            self.log_message("Disconnected from Arduino. Hardware state maintained.")
            
        except Exception as e:
            self.log_message(f"Error during disconnection: {str(e)}")
    
    def send_command(self, command):
        """Send command to Arduino via serial"""
        if not self.connected or not self.serial_connection:
            return False
        
        try:
            self.serial_connection.write(command.encode())
            self.serial_connection.flush()
            return True
        except Exception as e:
            self.log_message(f"Communication error: {str(e)}")
            return False
    
    # Digital Twin Methods
    def update_digital_twin_display(self):
        """Update the digital twin display with current data"""
        
        # Update thing information
        thing_info = self.digital_twin.get_thing_info()
        for field, label in self.thing_info_labels.items():
            value = thing_info.get(field, "N/A")
            if isinstance(value, list):
                value = ", ".join(value)
            label.config(text=str(value))
        
        # Update horn status
        horn_status = self.digital_twin.get_horn_status()
        self.dt_horn_status.config(
            text=horn_status,
            foreground="green" if horn_status == "ON" else "red"
        )
        
        # Update statistics
        stats = self.digital_twin.get_horn_statistics()
        self.stats_labels["activationCount"].config(text=str(stats["activationCount"]))
        
        last_activated = stats["lastActivated"]
        if last_activated:
            try:
                dt = datetime.datetime.fromisoformat(last_activated.replace('Z', '+00:00'))
                formatted_time = dt.strftime("%Y-%m-%d %H:%M:%S")
            except:
                formatted_time = last_activated
        else:
            formatted_time = "Never"
        
        self.stats_labels["lastActivated"].config(text=formatted_time)
    
    def refresh_digital_twin(self):
        """Reload digital twin data from file"""
        if self.digital_twin.load_digital_twin():
            self.update_digital_twin_display()
            self.log_message("Digital Twin data refreshed from file.")
        else:
            messagebox.showerror("Error", "Failed to reload Digital Twin data")
    
    # Control Methods
    def activate_horn_dt_only(self):
        """Activate horn in digital twin and sync to hardware if connected"""
        if self.digital_twin.set_horn_status("ON"):
            # Also update hardware if connected
            if self.connected:
                if self.send_command('1'):
                    self.hardware_horn_state = True
                    self.hw_horn_status.config(text="ON", foreground="green")
                    self.log_message("Horn activated in Digital Twin and synced to hardware.")
                else:
                    self.log_message("Horn activated in Digital Twin, but failed to sync to hardware.")
            else:
                self.log_message("Horn activated in Digital Twin (hardware not connected).")
            self.update_digital_twin_display()
        else:
            messagebox.showerror("Error", "Failed to update Digital Twin")
    
    def deactivate_horn_dt_only(self):
        """Deactivate horn in digital twin and sync to hardware if connected"""
        if self.digital_twin.set_horn_status("OFF"):
            # Also update hardware if connected
            if self.connected:
                if self.send_command('0'):
                    self.hardware_horn_state = False
                    self.hw_horn_status.config(text="OFF", foreground="red")
                    self.log_message("Horn deactivated in Digital Twin and synced to hardware.")
                else:
                    self.log_message("Horn deactivated in Digital Twin, but failed to sync to hardware.")
            else:
                self.log_message("Horn deactivated in Digital Twin (hardware not connected).")
            self.update_digital_twin_display()
        else:
            messagebox.showerror("Error", "Failed to update Digital Twin")
    
    def turn_horn_on_hw_only(self):
        """Turn horn on in hardware and sync to digital twin"""
        if self.send_command('1'):
            self.hardware_horn_state = True
            self.hw_horn_status.config(text="ON", foreground="green")
            
            # Also update digital twin
            if self.digital_twin.set_horn_status("ON"):
                self.log_message("Horn turned ON in hardware and synced to Digital Twin.")
                self.update_digital_twin_display()
            else:
                self.log_message("Horn turned ON in hardware, but failed to sync to Digital Twin.")
    
    def turn_horn_off_hw_only(self):
        """Turn horn off in hardware and sync to digital twin"""
        if self.send_command('0'):
            self.hardware_horn_state = False
            self.hw_horn_status.config(text="OFF", foreground="red")
            
            # Also update digital twin
            if self.digital_twin.set_horn_status("OFF"):
                self.log_message("Horn turned OFF in hardware and synced to Digital Twin.")
                self.update_digital_twin_display()
            else:
                self.log_message("Horn turned OFF in hardware, but failed to sync to Digital Twin.")
    
    def log_message(self, message):
        """Add a timestamped message to both activity logs"""
        timestamp = time.strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        
        # Add to Digital Twin log
        if hasattr(self, 'dt_log_text'):
            self.dt_log_text.insert(tk.END, log_entry)
            self.dt_log_text.see(tk.END)  # Auto-scroll to bottom
        
        # Add to Hardware log
        if hasattr(self, 'hw_log_text'):
            self.hw_log_text.insert(tk.END, log_entry)
            self.hw_log_text.see(tk.END)  # Auto-scroll to bottom
    
    def on_closing(self):
        """Handle application close event"""
        if self.connected:
            self.disconnect_arduino()
        self.root.destroy()


def main():
    """Main function to start the Integrated Car Digital Twin Controller"""
    
    # Check dependencies
    try:
        import serial
        import serial.tools.list_ports
    except ImportError:
        print("Error: pyserial library not found.")
        print("Please install it using: pip install pyserial")
        return
    
    # Check MongoDB connection
    print("🔄 Checking MongoDB connection...")
    try:
        client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        client.close()
        print("✅ MongoDB is accessible")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("Please start MongoDB using: docker start mongodb")
        print("Or start the full docker stack with: docker-compose up -d")
        return
    
    # Create and run the application
    root = tk.Tk()
    app = IntegratedCarController(root)
    
    def on_closing():
        """Handle application shutdown"""
        try:
            if hasattr(app, 'digital_twin') and app.digital_twin:
                app.digital_twin.close_connection()
            if hasattr(app, 'serial_connection') and app.serial_connection:
                app.serial_connection.close()
        except Exception as e:
            print(f"Error during cleanup: {e}")
        finally:
            root.destroy()
    
    root.protocol("WM_DELETE_WINDOW", on_closing)
    
    try:
        root.mainloop()
    except KeyboardInterrupt:
        print("\nApplication interrupted by user.")
        on_closing()
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        on_closing()


if __name__ == "__main__":
    main()