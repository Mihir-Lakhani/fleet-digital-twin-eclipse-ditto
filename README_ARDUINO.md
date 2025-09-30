# Arduino Buzzer Controller GUI

A Python GUI application to control an Arduino buzzer via serial communication using tkinter and pyserial.

## Features

- **Simple GUI Interface**: Clean, user-friendly interface with tkinter
- **Serial Communication**: Communicates with Arduino at 9600 baud rate
- **COM Port Selection**: Dropdown to select the correct COM port
- **Connection Management**: Connect/disconnect functionality with status display
- **Buzzer Control**: Two buttons to turn buzzer ON/OFF
- **State Display**: Shows current buzzer state (ON/OFF)
- **Error Handling**: Graceful handling of serial connection errors
- **Auto-detection**: Attempts to auto-detect Arduino COM ports

## Installation

1. **Install Python Dependencies**:
   ```bash
   pip install pyserial
   ```
   
   Or use the requirements file:
   ```bash
   pip install -r arduino_requirements.txt
   ```

2. **Upload Arduino Sketch**:
   - Open `arduino_buzzer_sketch.ino` in Arduino IDE
   - Connect your Arduino via USB
   - Upload the sketch to your Arduino

## Hardware Setup

### Basic Setup (Buzzer):
- Connect buzzer positive lead to Arduino digital pin 8
- Connect buzzer negative lead to Arduino GND

### Alternative Setup (LED for testing):
- The sketch also controls the built-in LED on pin 13
- No additional wiring needed for LED testing

### Circuit Diagram:
```
Arduino UNO          Buzzer
    Pin 8  ---------> (+) Positive
    GND    ---------> (-) Negative
```

## Usage

1. **Connect Arduino**:
   - Connect your Arduino to your computer via USB
   - Ensure the Arduino sketch is uploaded

2. **Run the Python GUI**:
   ```bash
   python arduino_buzzer_controller.py
   ```

3. **Use the Interface**:
   - Select the correct COM port from the dropdown
   - Click "Refresh" if your Arduino doesn't appear
   - Click "Connect" to establish serial connection
   - Use "Turn Buzzer ON" and "Turn Buzzer OFF" buttons to control the buzzer
   - Monitor the connection status and buzzer state

## File Structure

```
├── arduino_buzzer_controller.py    # Main Python GUI application
├── arduino_buzzer_sketch.ino       # Arduino sketch to upload
├── arduino_requirements.txt        # Python dependencies
└── README_ARDUINO.md              # This file
```

## Arduino Sketch Details

The Arduino sketch (`arduino_buzzer_sketch.ino`) includes:

- **Serial Communication**: Listens on serial port at 9600 baud
- **Command Processing**: Responds to '1' (ON) and '0' (OFF) commands
- **Pin Control**: Controls both buzzer (pin 8) and LED (pin 13)
- **Feedback**: Sends confirmation messages back to the GUI
- **Error Handling**: Handles invalid commands gracefully

### Commands:
- Send `'1'` → Buzzer turns ON
- Send `'0'` → Buzzer turns OFF

## Python GUI Details

The Python application (`arduino_buzzer_controller.py`) includes:

### Key Features:
- **COM Port Management**: Auto-detection and manual selection
- **Connection Handling**: Robust serial connection with error handling
- **User Interface**: Clean tkinter-based GUI
- **State Management**: Tracks and displays buzzer state
- **Error Messages**: User-friendly error dialogs

### GUI Components:
- COM port selection dropdown
- Connect/Disconnect button
- Buzzer control buttons
- Status indicators
- Information panel

## Troubleshooting

### Common Issues:

1. **"No COM ports found"**:
   - Ensure Arduino is connected via USB
   - Check if Arduino drivers are installed
   - Try a different USB cable or port

2. **"Failed to connect"**:
   - Verify the correct COM port is selected
   - Close Arduino IDE or other programs using the port
   - Check if Arduino is properly connected

3. **Buzzer not working**:
   - Verify wiring connections
   - Test with the built-in LED first
   - Check if Arduino sketch is uploaded correctly

4. **pyserial not found**:
   ```bash
   pip install pyserial
   ```

### Testing Steps:

1. **Test with LED**: The sketch controls pin 13 (built-in LED) for visual feedback
2. **Serial Monitor**: Use Arduino IDE Serial Monitor to test commands manually
3. **COM Port Check**: Verify Arduino appears in Device Manager (Windows)

## Customization

### Modifying the Arduino Sketch:
- Change `BUZZER_PIN` to use a different pin
- Add buzzer patterns (pulsing, different tones)
- Implement additional commands

### Modifying the Python GUI:
- Add more control buttons
- Implement buzzer patterns from GUI
- Add serial monitoring display
- Customize the interface appearance

## Hardware Requirements

- **Arduino**: UNO, Nano, or compatible board
- **Buzzer**: Any 5V piezo buzzer or active buzzer
- **Computer**: Windows/Mac/Linux with Python 3.6+
- **USB Cable**: For Arduino connection

## Software Requirements

- **Python**: 3.6 or higher
- **Libraries**: pyserial, tkinter (included with Python)
- **Arduino IDE**: For uploading the sketch

## License

This project is open source and available for educational and personal use.