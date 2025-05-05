# 📦 IoT Warehouse Management System – v5

A smart, modular IoT system for secure chemical warehouse management using **ESP32**, **RFID**, **IR sensors**, **servo motors**, and a **React dashboard**.

---

## 🔧 Features

- 🔐 **RFID-based access control** for chemical containers
- 🧠 **Smart classification** of chemicals via backend API
- 🤖 **Servo automation** for compartment access (Flammable, Corrosive, Cold, Other)
- 🔦 **IR sensors** to detect unauthorized access attempts
- 🌐 **React dashboard** with real-time data & alerts
- 📡 Wi-Fi-based communication between ESP32 devices and server

---

## 🗂️ Folder Structure

| Folder/File           | Description                                      |
|-----------------------|--------------------------------------------------|
| `dashboard/`          | React front-end using Vite, for visualization   |
| `ir_timeCode/`        | ESP32 + IR sensors for intrusion detection      |
| `writeRFID.ino`       | Arduino sketch to write chemical data to RFID   |
| `ProgrammableRFID.ino`| Checks if RFID tags are writeable               |
| `UpdatedRFIDServo.ino`| Main logic: RFID → API → Servo/LED control      |
| `app_api.py`          | Python backend API (FastAPI recommended)        |

---

## 🔑 RFID Flow (`UpdatedRFIDServo.ino`)

1. RFID card scanned → UID + data extracted  
2. Data sent to `/api/rfid` as JSON  
3. Server responds with chemical **type**  
4. Correct **servo & LED** activated  
5. Servo returns to default after delay  

---

## 💻 Frontend (`dashboard/`)

- Built with **React + Vite**
- ESLint support for code quality
- Modular component system
- Live updates from backend APIs

---

## 🔐 IR Security (`ir_timeCode/`)

- Uses IR sensors + real-time clock logic
- Sends alerts to server if movement is detected during restricted times

---

## 🧪 Writing RFID Cards (`writeRFID.ino`)

- Preloaded with 6 card profiles:
  - ID (4 bytes)
  - Quantity (4 bytes)
- Enter `1`–`6` via Serial to select card
- Tap RFID tag to write data to block 1

---

## 🔍 Tag Testing (`ProgrammableRFID.ino`)

- Confirms if tag can be written
- Writes test message `TESTWRITEABLE` to block 4

---

## 📦 Backend API (`app_api.py`, 'server.js')

- Accepts RFID reads, maps to chemical types
- Exposes `/api/rfid` and `/api/esp32` and other endpoints using express js
- Returns correct chemical classification
- using database - SQLLite/MySQL
---

## ⚙️ Dependencies

- ESP32 board
- MFRC522 RFID reader
- Servo motors (x4)
- IR sensors (x2)
- LEDs (x4)
- DHT11 (optional for temp sensing)
- Python 3.10+ and express JS (for OCR and backend)
- Python(for API)
- Vite + React (for dashboard)
- mySQL/SQLlite for database

---

## 🚀 Quick Start

1. Flash `UpdatedRFIDServo.ino` to ESP32  
2. Run `app_api.py` using FastAPI  
3. Start dashboard with:

   ```bash
   cd dashboard
   npm install
   npm run dev
