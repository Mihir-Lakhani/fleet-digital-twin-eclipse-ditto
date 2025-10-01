/*
  Car Digital Twin - Horn Controller Arduino Sketch
  
  This Arduino sketch controls a buzzer/horn based on serial commands from the Python GUI.
  
  Hardware Setup:
  - Connect buzzer/horn positive pin to digital pin 8
  - Connect buzzer/horn negative pin to GND
  - Connect Arduino to computer via USB
  - Connect LCD: GND→GND, VCC→5V, SDA→A4, SCL→A5
  
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

#include <LiquidCrystal_I2C.h>

// LCD setup
LiquidCrystal_I2C lcd(0x27, 16, 2);  // 0x27 is common I2C address

// Pin definitions
const int HORN_PIN = 8;        // Digital pin connected to buzzer/horn
const int LED_PIN = 13;        // Built-in LED for status indication

// Variables
bool hornState = false;        // Current state of the horn
char receivedChar;             // Character received from serial

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
  
  // Initialize LCD display
  lcd.init();                    // Initialize the LCD
  lcd.backlight();               // Turn on backlight
  lcd.setCursor(0, 0);           // Set cursor to first line
  lcd.print("Car Digital Twin");
  lcd.setCursor(0, 1);           // Set cursor to second line  
  lcd.print("Horn: OFF");        // Show initial horn status
  
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
  
  // Small delay to prevent overwhelming the serial buffer
  delay(1);  // Reduced delay for better buzzer timing
}

void turnHornOn() {
  hornState = true;
  digitalWrite(LED_PIN, HIGH);
  lastBuzzerTime = millis();  // Reset buzzer timing
  buzzerToggle = false;       // Start with buzzer OFF for first toggle
  
  // Update LCD display
  lcd.setCursor(6, 1);        // Position after "Horn: "
  lcd.print("ON ");           // Show ON status (extra space to clear OFF)
  
  Serial.println("Horn ON - Continuous ticking started");
  
  // Send confirmation
  Serial.flush();
}

void turnHornOff() {
  hornState = false;
  digitalWrite(HORN_PIN, LOW);   // Ensure buzzer is OFF
  digitalWrite(LED_PIN, LOW);
  buzzerToggle = false;          // Reset toggle state
  
  // Update LCD display
  lcd.setCursor(6, 1);           // Position after "Horn: "
  lcd.print("OFF");              // Show OFF status
  
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
  
  // Update LCD display
  lcd.setCursor(6, 1);           // Position after "Horn: "
  lcd.print("OFF");              // Show OFF status
  
  Serial.println("EMERGENCY STOP - Horn OFF");
  Serial.flush();
}