Overview
This repository contains the latest version (v5) of the software stack for our IoT-based warehouse management system. The project integrates hardware (e.g., ESP32 sensors) and software components to monitor and manage warehouse operations effectively.

Folder Structure and Functionalities
Root Folder
 Basic information about the repository and its purpose.

Contains the main project configuration files and scripts.

dashboard/
Purpose: Front-end application built with React and Vite.

Functionalities:
Provides an interactive user interface for monitoring sensor data and managing alerts.
Configured with ESLint for maintaining code quality.
Includes templates and plugins for efficient development.


ir_timeCode/
Purpose: Arduino-based code for IR sensors.
Functionalities:
Detects intrusions during specific time intervals and sends alerts to the backend.
Configures Wi-Fi settings and integrates with server endpoints.


app_api.py
Purpose: Back-end API for processing and managing warehouse operations.
Functionalities:
Manages RFID inputs, user data, and alert systems.
Integrates with ESP32 for servo control and chemical classification.
Provides endpoints for real-time data updates and response handling.

