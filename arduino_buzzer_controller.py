#!/usr/bin/env python3
"""
Arduino Buzzer Controller GUI
A simple GUI application to control an Arduino buzzer via serial communication.

Requirements:
- Arduino connected via USB/Serial
- Arduino programmed to respond to '1' (buzzer ON) and '0' (buzzer OFF)
- pyserial library installed: pip install pyserial
"""

import tkinter as tk
from tkinter import ttk, messagebox
import serial
import serial.tools.list_ports
import threading
import time

class ArduinoBuzzerController:
    def __init__(self, root):
        self.root = root
        self.root.title("Arduino Buzzer Controller")
        self.root.geometry("450x400")
        self.root.resizable(True, True)
        
        # Serial connection variables
        self.serial_connection = None
        self.is_connected = False
        self.buzzer_state = "OFF"
        
        # Create GUI elements
        self.create_widgets()
        
        # Populate COM ports
        self.refresh_com_ports()
        
    def create_widgets(self):
        """Create and arrange all GUI widgets"""
        
        # Main frame with scrollable content
        main_frame = ttk.Frame(self.root, padding="15")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure root grid weights for proper resizing
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        
        # COM Port Selection Frame
        com_frame = ttk.LabelFrame(main_frame, text="Serial Connection", padding="10")
        com_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 15))
        com_frame.columnconfigure(1, weight=1)
        
        # COM Port Label and Dropdown
        ttk.Label(com_frame, text="COM Port:").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        
        self.com_port_var = tk.StringVar()
        self.com_port_combo = ttk.Combobox(com_frame, textvariable=self.com_port_var, 
                                          state="readonly", width=15)
        self.com_port_combo.grid(row=0, column=1, sticky=tk.W, padx=(0, 10))
        
        # Refresh COM ports button
        self.refresh_btn = ttk.Button(com_frame, text="Refresh", 
                                     command=self.refresh_com_ports, width=10)
        self.refresh_btn.grid(row=0, column=2, padx=(0, 10))
        
        # Connect/Disconnect button
        self.connect_btn = ttk.Button(com_frame, text="Connect", 
                                     command=self.toggle_connection, width=12)
        self.connect_btn.grid(row=0, column=3)
        
        # Connection status
        self.status_label = ttk.Label(com_frame, text="Status: Disconnected", 
                                     foreground="red")
        self.status_label.grid(row=1, column=0, columnspan=4, pady=(10, 0))
        
        # Buzzer Control Frame
        control_frame = ttk.LabelFrame(main_frame, text="Buzzer Control", padding="10")
        control_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 15))
        
        # Current State Display
        state_frame = ttk.Frame(control_frame)
        state_frame.grid(row=0, column=0, columnspan=2, pady=(0, 15))
        
        ttk.Label(state_frame, text="Buzzer State:", font=("Arial", 12)).pack(side=tk.LEFT)
        self.state_label = ttk.Label(state_frame, text="OFF", font=("Arial", 12, "bold"), 
                                    foreground="red")
        self.state_label.pack(side=tk.LEFT, padx=(10, 0))
        
        # Control Buttons
        button_frame = ttk.Frame(control_frame)
        button_frame.grid(row=1, column=0, columnspan=2)
        
        self.on_btn = ttk.Button(button_frame, text="Turn Buzzer ON", 
                                command=self.turn_buzzer_on, width=20)
        self.on_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        self.off_btn = ttk.Button(button_frame, text="Turn Buzzer OFF", 
                                 command=self.turn_buzzer_off, width=20)
        self.off_btn.pack(side=tk.LEFT)
        
        # Initially disable control buttons
        self.on_btn.config(state="disabled")
        self.off_btn.config(state="disabled")
        
        # Info Frame with better text wrapping
        info_frame = ttk.LabelFrame(main_frame, text="Information", padding="10")
        info_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(10, 0))
        
        # Create a text widget for better content display
        info_text_widget = tk.Text(info_frame, height=6, width=50, wrap=tk.WORD, 
                                  font=("Segoe UI", 9), bg=self.root.cget('bg'),
                                  relief=tk.FLAT, state=tk.DISABLED)
        info_text_widget.pack(fill=tk.BOTH, expand=True)
        
        # Enable text widget temporarily to insert content
        info_text_widget.config(state=tk.NORMAL)
        info_content = (
            "Instructions:\n\n"
            "1. Select your Arduino's COM port from the dropdown above\n\n"
            "2. Click 'Connect' to establish serial connection\n\n"
            "3. Use the buzzer control buttons to send commands\n\n"
            "4. Arduino should be programmed to respond to '1' (ON) and '0' (OFF)\n\n"
            "5. The buzzer state will be displayed above the control buttons"
        )
        info_text_widget.insert(tk.END, info_content)
        info_text_widget.config(state=tk.DISABLED)
        
        # Configure main frame grid weights for proper expansion
        main_frame.columnconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(2, weight=1)  # Allow info frame to expand
        
    def refresh_com_ports(self):
        """Refresh the list of available COM ports"""
        try:
            ports = serial.tools.list_ports.comports()
            port_names = [port.device for port in ports]
            
            self.com_port_combo['values'] = port_names
            
            if port_names:
                # Set default to first port or try to find Arduino-like port
                arduino_ports = [port for port in port_names if 'USB' in port or 'Arduino' in str(port)]
                if arduino_ports:
                    self.com_port_var.set(arduino_ports[0])
                else:
                    self.com_port_var.set(port_names[0])
            else:
                self.com_port_var.set("")
                messagebox.showwarning("No Ports", "No COM ports found. Please check your Arduino connection.")
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to refresh COM ports: {str(e)}")
    
    def toggle_connection(self):
        """Connect or disconnect from the Arduino"""
        if not self.is_connected:
            self.connect_to_arduino()
        else:
            self.disconnect_from_arduino()
    
    def connect_to_arduino(self):
        """Establish serial connection to Arduino"""
        com_port = self.com_port_var.get()
        
        if not com_port:
            messagebox.showerror("Error", "Please select a COM port first.")
            return
        
        try:
            # Attempt to establish serial connection
            self.serial_connection = serial.Serial(
                port=com_port,
                baudrate=9600,
                timeout=1,
                write_timeout=1
            )
            
            # Give Arduino time to reset
            time.sleep(2)
            
            self.is_connected = True
            self.update_connection_status(True)
            
            messagebox.showinfo("Connected", f"Successfully connected to {com_port}")
            
        except serial.SerialException as e:
            error_msg = str(e)
            if "Access is denied" in error_msg or "PermissionError" in error_msg:
                messagebox.showerror("Port In Use", 
                                   f"COM port {com_port} is currently in use!\n\n"
                                   "Please:\n"
                                   "1. Close Arduino IDE completely\n"
                                   "2. Close any Serial Monitor windows\n"
                                   "3. Make sure no other programs are using the port\n"
                                   "4. Try clicking 'Connect' again")
            else:
                messagebox.showerror("Connection Error", 
                                   f"Failed to connect to {com_port}:\n{str(e)}\n\n"
                                   "Please check:\n"
                                   "- Arduino is connected\n"
                                   "- Correct COM port selected\n"
                                   "- Arduino sketch is uploaded\n"
                                   "- Port is not in use by another application")
        except Exception as e:
            messagebox.showerror("Error", f"Unexpected error: {str(e)}")
    
    def disconnect_from_arduino(self):
        """Close serial connection to Arduino"""
        try:
            if self.serial_connection and self.serial_connection.is_open:
                self.serial_connection.close()
            
            self.is_connected = False
            self.serial_connection = None
            self.update_connection_status(False)
            
            messagebox.showinfo("Disconnected", "Successfully disconnected from Arduino")
            
        except Exception as e:
            messagebox.showerror("Error", f"Error during disconnection: {str(e)}")
    
    def update_connection_status(self, connected):
        """Update GUI elements based on connection status"""
        if connected:
            self.status_label.config(text="Status: Connected", foreground="green")
            self.connect_btn.config(text="Disconnect")
            self.on_btn.config(state="normal")
            self.off_btn.config(state="normal")
            self.com_port_combo.config(state="disabled")
            self.refresh_btn.config(state="disabled")
        else:
            self.status_label.config(text="Status: Disconnected", foreground="red")
            self.connect_btn.config(text="Connect")
            self.on_btn.config(state="disabled")
            self.off_btn.config(state="disabled")
            self.com_port_combo.config(state="readonly")
            self.refresh_btn.config(state="normal")
            self.update_buzzer_state("OFF")
    
    def send_command(self, command):
        """Send command to Arduino via serial"""
        if not self.is_connected or not self.serial_connection:
            messagebox.showerror("Error", "Not connected to Arduino")
            return False
        
        try:
            # Send command as bytes
            self.serial_connection.write(command.encode())
            self.serial_connection.flush()
            return True
            
        except serial.SerialTimeoutException:
            messagebox.showerror("Timeout", "Serial write timeout. Arduino may not be responding.")
            return False
        except serial.SerialException as e:
            messagebox.showerror("Serial Error", f"Serial communication error: {str(e)}")
            self.disconnect_from_arduino()
            return False
        except Exception as e:
            messagebox.showerror("Error", f"Unexpected error: {str(e)}")
            return False
    
    def turn_buzzer_on(self):
        """Send command to turn buzzer ON"""
        if self.send_command('1'):
            self.update_buzzer_state("ON")
    
    def turn_buzzer_off(self):
        """Send command to turn buzzer OFF"""
        if self.send_command('0'):
            self.update_buzzer_state("OFF")
    
    def update_buzzer_state(self, state):
        """Update the buzzer state display"""
        self.buzzer_state = state
        self.state_label.config(text=state)
        
        if state == "ON":
            self.state_label.config(foreground="green")
        else:
            self.state_label.config(foreground="red")
    
    def on_closing(self):
        """Handle window closing event"""
        if self.is_connected:
            self.disconnect_from_arduino()
        self.root.destroy()

def main():
    """Main function to run the application"""
    # Check if pyserial is available
    try:
        import serial
    except ImportError:
        print("Error: pyserial library not found.")
        print("Please install it using: pip install pyserial")
        return
    
    # Create and run the GUI application
    root = tk.Tk()
    app = ArduinoBuzzerController(root)
    
    # Handle window closing
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    
    # Center the window on screen
    root.update_idletasks()
    x = (root.winfo_screenwidth() // 2) - (root.winfo_width() // 2)
    y = (root.winfo_screenheight() // 2) - (root.winfo_height() // 2)
    root.geometry(f"+{x}+{y}")
    
    # Start the GUI event loop
    root.mainloop()

if __name__ == "__main__":
    main()