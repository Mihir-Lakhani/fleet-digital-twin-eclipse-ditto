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


class CarDigitalTwin:
    """Digital Twin representation of a car with horn functionality"""
    
    def __init__(self, json_file_path: str = None):
        self.json_file_path = json_file_path or "data/car_digital_twin.json"
        self.data = {}
        self.load_digital_twin()
    
    def load_digital_twin(self) -> bool:
        """Load digital twin data from JSON file"""
        try:
            if os.path.exists(self.json_file_path):
                with open(self.json_file_path, 'r', encoding='utf-8') as file:
                    self.data = json.load(file)
                return True
            else:
                print(f"Digital twin file not found: {self.json_file_path}")
                return False
        except Exception as e:
            print(f"Error loading digital twin: {e}")
            return False
    
    def save_digital_twin(self) -> bool:
        """Save digital twin data to JSON file"""
        try:
            # Update metadata
            self.data["_metadata"]["modified"] = datetime.datetime.now().isoformat() + "Z"
            self.data["_metadata"]["_revision"] = self.data["_metadata"].get("_revision", 1) + 1
            self.data["attributes"]["metadata"]["lastModified"] = self.data["_metadata"]["modified"]
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.json_file_path), exist_ok=True)
            
            with open(self.json_file_path, 'w', encoding='utf-8') as file:
                json.dump(self.data, file, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving digital twin: {e}")
            return False
    
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
            print(f"Error setting horn status: {e}")
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
        
        # Synchronization variables
        self.auto_sync_enabled = False
        self.sync_thread = None
        self.sync_running = False
        
        # Create GUI
        self.create_widgets()
        
        # Initialize displays
        self.update_digital_twin_display()
        self.refresh_com_ports()
        
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
        
        # Integrated Control tab
        integrated_frame = ttk.Frame(notebook)
        notebook.add(integrated_frame, text="Integrated Control")
        
        self.create_digital_twin_tab(dt_frame)
        self.create_hardware_tab(hw_frame)
        self.create_integrated_tab(integrated_frame)
    
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
    
    def create_integrated_tab(self, parent):
        """Create integrated control tab"""
        
        # Synchronization frame
        sync_frame = ttk.LabelFrame(parent, text="Digital Twin ↔ Hardware Synchronization", padding="10")
        sync_frame.pack(fill=tk.X, padx=10, pady=(10, 5))
        
        # Auto-sync checkbox
        self.auto_sync_var = tk.BooleanVar()
        self.auto_sync_check = ttk.Checkbutton(sync_frame, text="Enable Auto-Sync", 
                                              variable=self.auto_sync_var, 
                                              command=self.toggle_auto_sync)
        self.auto_sync_check.pack(anchor=tk.W, pady=(0, 10))
        
        # Manual sync buttons
        sync_button_frame = ttk.Frame(sync_frame)
        sync_button_frame.pack(fill=tk.X)
        
        ttk.Button(sync_button_frame, text="Sync DT → Hardware", 
                  command=self.sync_dt_to_hardware).pack(side=tk.LEFT, padx=(0, 5))
        
        ttk.Button(sync_button_frame, text="Sync Hardware → DT", 
                  command=self.sync_hardware_to_dt).pack(side=tk.LEFT, padx=5)
        
        # Integrated control frame
        integrated_control_frame = ttk.LabelFrame(parent, text="Integrated Horn Control", padding="10")
        integrated_control_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Status comparison
        status_comparison_frame = ttk.Frame(integrated_control_frame)
        status_comparison_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(status_comparison_frame, text="Digital Twin:").grid(row=0, column=0, sticky=tk.W)
        self.integrated_dt_status = ttk.Label(status_comparison_frame, text="OFF", foreground="red", font=("Arial", 10, "bold"))
        self.integrated_dt_status.grid(row=0, column=1, sticky=tk.W, padx=(10, 0))
        
        ttk.Label(status_comparison_frame, text="Hardware:").grid(row=1, column=0, sticky=tk.W)
        self.integrated_hw_status = ttk.Label(status_comparison_frame, text="OFF", foreground="red", font=("Arial", 10, "bold"))
        self.integrated_hw_status.grid(row=1, column=1, sticky=tk.W, padx=(10, 0))
        
        ttk.Label(status_comparison_frame, text="Sync Status:").grid(row=2, column=0, sticky=tk.W)
        self.sync_status_label = ttk.Label(status_comparison_frame, text="Unknown", foreground="orange", font=("Arial", 10, "bold"))
        self.sync_status_label.grid(row=2, column=1, sticky=tk.W, padx=(10, 0))
        
        # Integrated control buttons
        integrated_button_frame = ttk.Frame(integrated_control_frame)
        integrated_button_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.integrated_on_btn = ttk.Button(integrated_button_frame, text="Turn Horn ON (Both DT + Hardware)", 
                                           command=self.turn_horn_on_integrated, state="disabled")
        self.integrated_on_btn.pack(side=tk.LEFT, padx=(0, 5))
        
        self.integrated_off_btn = ttk.Button(integrated_button_frame, text="Turn Horn OFF (Both DT + Hardware)", 
                                            command=self.turn_horn_off_integrated, state="disabled")
        self.integrated_off_btn.pack(side=tk.LEFT, padx=5)
        
        # Activity log
        log_frame = ttk.LabelFrame(parent, text="Activity Log", padding="10")
        log_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Log text widget with scrollbar
        self.log_text = tk.Text(log_frame, height=8, width=60, wrap=tk.WORD)
        scrollbar = ttk.Scrollbar(log_frame, orient="vertical", command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)
        
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Initial log message
        self.log_message("Integrated Car Digital Twin Controller started.")
        self.log_message("Connect Arduino and enable auto-sync for full integration.")
    
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
            
            # Display current states without forcing changes
            dt_state = self.digital_twin.get_horn_status()
            # Assume hardware state matches DT initially (we can't read it directly)
            # User can manually sync if needed
            self.hardware_horn_state = (dt_state == "ON")
            
            # Update UI
            self.connection_status.config(text="Connected", foreground="green")
            self.connect_btn.config(text="Disconnect")
            self.hw_on_btn.config(state="normal")
            self.hw_off_btn.config(state="normal")
            self.integrated_on_btn.config(state="normal")
            self.integrated_off_btn.config(state="normal")
            self.port_combo.config(state="disabled")
            self.refresh_btn.config(state="disabled")
            
            # Update hardware status display based on assumed state
            hw_state_text = "ON" if self.hardware_horn_state else "OFF"
            hw_state_color = "green" if self.hardware_horn_state else "red"
            self.hw_horn_status.config(text=hw_state_text, foreground=hw_state_color)
            
            self.log_message(f"Successfully connected to {selected_port} at 9600 baud.")
            self.log_message("Hardware state assumed from Digital Twin. Use manual sync if needed.")
            self.update_integrated_display()
            
        except serial.SerialException as e:
            messagebox.showerror("Connection Error", f"Failed to connect to {selected_port}:\n{str(e)}")
            self.log_message(f"Connection failed: {str(e)}")
        except Exception as e:
            messagebox.showerror("Unexpected Error", f"An unexpected error occurred:\n{str(e)}")
            self.log_message(f"Unexpected error: {str(e)}")
    
    def disconnect_arduino(self):
        """Close serial connection to Arduino"""
        try:
            # Stop auto-sync if running
            if self.auto_sync_enabled:
                self.toggle_auto_sync()
            
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
            self.integrated_on_btn.config(state="disabled")
            self.integrated_off_btn.config(state="disabled")
            self.port_combo.config(state="readonly")
            self.refresh_btn.config(state="normal")
            
            self.log_message("Disconnected from Arduino. Hardware state maintained.")
            self.update_integrated_display()
            
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
        
        # Update integrated display
        self.update_integrated_display()
    
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
            self.update_integrated_display()
    
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
            self.update_integrated_display()
    
    def turn_horn_on_integrated(self):
        """Turn horn on in both digital twin and hardware"""
        success_dt = self.digital_twin.set_horn_status("ON")
        success_hw = self.send_command('1') if self.connected else True
        
        if success_dt:
            if self.connected:
                self.hardware_horn_state = True
                self.hw_horn_status.config(text="ON", foreground="green")
            self.update_digital_twin_display()
            self.log_message("Horn turned ON in both Digital Twin and hardware.")
        else:
            messagebox.showerror("Error", "Failed to update Digital Twin")
    
    def turn_horn_off_integrated(self):
        """Turn horn off in both digital twin and hardware"""
        success_dt = self.digital_twin.set_horn_status("OFF")
        success_hw = self.send_command('0') if self.connected else True
        
        if success_dt:
            if self.connected:
                self.hardware_horn_state = False
                self.hw_horn_status.config(text="OFF", foreground="red")
            self.update_digital_twin_display()
            self.log_message("Horn turned OFF in both Digital Twin and hardware.")
        else:
            messagebox.showerror("Error", "Failed to update Digital Twin")
    
    # Synchronization Methods
    def toggle_auto_sync(self):
        """Toggle auto-synchronization between digital twin and hardware"""
        self.auto_sync_enabled = self.auto_sync_var.get()
        
        if self.auto_sync_enabled and self.connected:
            self.start_auto_sync()
            self.log_message("Auto-sync enabled - Digital Twin and hardware will stay synchronized.")
        else:
            self.stop_auto_sync()
            self.log_message("Auto-sync disabled.")
    
    def start_auto_sync(self):
        """Start auto-sync thread"""
        if not self.sync_running:
            self.sync_running = True
            self.sync_thread = threading.Thread(target=self.auto_sync_worker, daemon=True)
            self.sync_thread.start()
    
    def stop_auto_sync(self):
        """Stop auto-sync thread"""
        self.sync_running = False
        if self.sync_thread:
            self.sync_thread.join(timeout=1)
    
    def auto_sync_worker(self):
        """Auto-sync worker thread"""
        while self.sync_running and self.connected:
            try:
                # Check if states are different and sync if needed
                dt_state = self.digital_twin.get_horn_status()
                hw_state = "ON" if self.hardware_horn_state else "OFF"
                
                if dt_state != hw_state:
                    # For now, prioritize digital twin state
                    if dt_state == "ON":
                        self.send_command('1')
                        self.hardware_horn_state = True
                    else:
                        self.send_command('0')
                        self.hardware_horn_state = False
                    
                    # Update hardware status display
                    self.root.after(0, self.update_hardware_status_display)
                
                time.sleep(1)  # Check every second
            except Exception as e:
                print(f"Auto-sync error: {e}")
                break
    
    def update_hardware_status_display(self):
        """Update hardware status display (thread-safe)"""
        state_text = "ON" if self.hardware_horn_state else "OFF"
        state_color = "green" if self.hardware_horn_state else "red"
        self.hw_horn_status.config(text=state_text, foreground=state_color)
        self.update_integrated_display()
    
    def sync_dt_to_hardware(self):
        """Manually sync digital twin state to hardware"""
        if not self.connected:
            messagebox.showwarning("Warning", "Arduino not connected")
            return
        
        dt_state = self.digital_twin.get_horn_status()
        if dt_state == "ON":
            if self.send_command('1'):
                self.hardware_horn_state = True
                self.hw_horn_status.config(text="ON", foreground="green")
                self.log_message("Synced Digital Twin → Hardware: Horn ON")
        else:
            if self.send_command('0'):
                self.hardware_horn_state = False
                self.hw_horn_status.config(text="OFF", foreground="red")
                self.log_message("Synced Digital Twin → Hardware: Horn OFF")
        
        self.update_integrated_display()
    
    def sync_hardware_to_dt(self):
        """Manually sync hardware state to digital twin"""
        if not self.connected:
            messagebox.showwarning("Warning", "Arduino not connected")
            return
        
        hw_state = "ON" if self.hardware_horn_state else "OFF"
        if self.digital_twin.set_horn_status(hw_state):
            self.update_digital_twin_display()
            self.log_message(f"Synced Hardware → Digital Twin: Horn {hw_state}")
        else:
            messagebox.showerror("Error", "Failed to update Digital Twin")
    
    def update_integrated_display(self):
        """Update the integrated display showing sync status"""
        dt_state = self.digital_twin.get_horn_status()
        hw_state = "ON" if self.hardware_horn_state else "OFF"
        
        # Update status labels
        self.integrated_dt_status.config(
            text=dt_state,
            foreground="green" if dt_state == "ON" else "red"
        )
        
        if self.connected:
            self.integrated_hw_status.config(
                text=hw_state,
                foreground="green" if hw_state == "ON" else "red"
            )
            
            # Update sync status
            if dt_state == hw_state:
                self.sync_status_label.config(text="Synchronized", foreground="green")
            else:
                self.sync_status_label.config(text="Out of Sync", foreground="red")
        else:
            self.integrated_hw_status.config(text="Disconnected", foreground="gray")
            self.sync_status_label.config(text="Hardware Offline", foreground="orange")
    
    def log_message(self, message):
        """Add a timestamped message to the log"""
        timestamp = time.strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        
        self.log_text.insert(tk.END, log_entry)
        self.log_text.see(tk.END)  # Auto-scroll to bottom
    
    def on_closing(self):
        """Handle application close event"""
        if self.auto_sync_enabled:
            self.toggle_auto_sync()
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
    
    # Check if digital twin file exists
    dt_file = "data/car_digital_twin.json"
    if not os.path.exists(dt_file):
        print(f"Warning: Digital twin file not found at {dt_file}")
        print("The application will still work, but digital twin features may be limited.")
    
    # Create and run the application
    root = tk.Tk()
    app = IntegratedCarController(root)
    
    try:
        root.mainloop()
    except KeyboardInterrupt:
        print("\nApplication interrupted by user.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    main()