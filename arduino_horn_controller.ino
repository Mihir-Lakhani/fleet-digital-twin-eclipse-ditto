/*
  Car Digital Twin - Horn Controller Arduino Sketch
  
  This Arduino sketch controls a buzzer/horn based on serial commands from the Python GUI.
  
  Hardware Setup:
  - Connect buzzer/horn positive pin to digital pin 8
  - Connect buzzer/horn negative pin to GND
  - Connect Arduino to computer via USB
  
  Serial Commands:
  - Send '1' to turn horn ON
  - Send '0' to turn horn OFF
  
  Compatible with:
  - arduino_buzzer_controller.py
  - car_digital_twin_manager.py
  - integrated_car_controller.py
  
  Author: Digital Twin System
  Date: September 30, 2025
*/

// Pin definitions
const int HORN_PIN = 8;        // Digital pin connected to buzzer/horn
const int LED_PIN = 13;        // Built-in LED for status indication

// Variables
bool hornState = false;        // Current state of the horn
char receivedChar;             // Character received from serial
unsigned long lastCommandTime = 0;  // Time of last command
const unsigned long TIMEOUT_MS = 30000;  // 30 second timeout for safety

// Buzzer timing variables
unsigned long lastBuzzerTime = 0;  // Last time buzzer was toggled
const unsigned long BUZZER_INTERVAL = 10;  // 10ms interval for buzzer ticking
bool buzzerToggle = false;     // Current state of buzzer toggle

void setup() {
  // Initialize serial communication at 9600 baud
  Serial.begin(9600);
  
  // Initialize pin modes
  pinMode(HORN_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // Start with horn OFF
  digitalWrite(HORN_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  hornState = false;
  
  // Send startup message
  Serial.println("Car Digital Twin - Horn Controller Ready");
  Serial.println("Commands: '1' = Horn ON, '0' = Horn OFF");
  
  // Flash LED to indicate ready
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}

void loop() {
  // Check for incoming serial data
  if (Serial.available() > 0) {
    receivedChar = Serial.read();
    lastCommandTime = millis();
    
    // Process commands
    switch (receivedChar) {
      case '1':
        // Turn horn ON
        turnHornOn();
        break;
        
      case '0':
        // Turn horn OFF
        turnHornOff();
        break;
        
      case '?':
        // Status request
        sendStatus();
        break;
        
      default:
        // Unknown command
        Serial.print("Unknown command: ");
        Serial.println(receivedChar);
        break;
    }
  }
  
  // Handle continuous buzzer ticking when horn is ON
  if (hornState) {
    unsigned long currentTime = millis();
    if (currentTime - lastBuzzerTime >= BUZZER_INTERVAL) {
      buzzerToggle = !buzzerToggle;  // Toggle buzzer state
      digitalWrite(HORN_PIN, buzzerToggle ? HIGH : LOW);
      lastBuzzerTime = currentTime;
    }
  }
  
  // Safety timeout - turn off horn if no command received for too long
  // This prevents the horn from staying on indefinitely if connection is lost
  // Note: When GUI is disconnected, horn will turn off after 30 seconds
  if (hornState && (millis() - lastCommandTime > TIMEOUT_MS)) {
    turnHornOff();
    Serial.println("Safety timeout - Horn turned OFF");
  }
  
  // Small delay to prevent overwhelming the serial buffer
  delay(1);  // Reduced delay for better buzzer timing
}

void turnHornOn() {
  hornState = true;
  digitalWrite(LED_PIN, HIGH);
  lastBuzzerTime = millis();  // Reset buzzer timing
  buzzerToggle = false;       // Start with buzzer OFF for first toggle
  
  Serial.println("Horn ON - Continuous ticking started");
  
  // Send confirmation
  Serial.flush();
}

void turnHornOff() {
  hornState = false;
  digitalWrite(HORN_PIN, LOW);   // Ensure buzzer is OFF
  digitalWrite(LED_PIN, LOW);
  buzzerToggle = false;          // Reset toggle state
  
  Serial.println("Horn OFF - Ticking stopped");
  
  // Send confirmation
  Serial.flush();
}

void sendStatus() {
  Serial.print("Horn Status: ");
  if (hornState) {
    Serial.println("ON");
  } else {
    Serial.println("OFF");
  }
  
  Serial.print("Uptime: ");
  Serial.print(millis() / 1000);
  Serial.println(" seconds");
  
  Serial.flush();
}

// Additional safety function - called if needed
void emergencyStop() {
  hornState = false;
  digitalWrite(HORN_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  buzzerToggle = false;  // Reset toggle state
  Serial.println("EMERGENCY STOP - Horn OFF");
  Serial.flush();
}