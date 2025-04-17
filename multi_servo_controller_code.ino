#include <ESP32Servo.h>

Servo servo1;  // Flammable
Servo servo2;  // Cold storage
Servo servo3;  // Corrosive
Servo servo4;  // Other chemicals

// Define pin numbers
int servoPin1 = 15;  // Pin for Flammable servo
int servoPin2 = 16;  // Pin for Cold storage servo
int servoPin3 = 17;  // Pin for Corrosive servo
int servoPin4 = 4;  // Pin for Other chemicals servo

void setup() {
    // Attach servos to pins
    servo1.attach(servoPin1);
    servo2.attach(servoPin2);
    servo3.attach(servoPin3);
    servo4.attach(servoPin4);
    
    // Initialize all servos to closed position
    servo1.write(0);
    servo2.write(0);
    servo3.write(0);
    servo4.write(0);
    
    Serial.begin(115200);
}

void loop() {
    if (Serial.available()) 
    {
        char input = Serial.read();
        
        // Close all servos first (make sure only one gate is open at a time)
        if(input == '1' || input == '0') 
        {
            servo1.write(0);
            servo2.write(0);
            servo3.write(0);
            servo4.write(0);
        }
        
        // Open the appropriate servo based on command
        if(input == '1')
        {
            servo1.write(90);
            servo2.write(90);
            servo3.write(90);
            servo4.write(90);
        }
        else if(input == '0')
        {
            servo1.write(0);
            servo2.write(0);
            servo3.write(0);
            servo4.write(0);
        }
    }
}