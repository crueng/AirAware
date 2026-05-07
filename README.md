# AirAware

AirAware is a school project for live collection and visualization of environmental sensor data.  
An ESP32-S3 reads sensor values, sends them via MQTT over WebSocket Secure to the server infrastructure, and the data is then displayed live through a backend and frontend.

## Project Idea

The goal of this project is to collect real sensor data using a microcontroller and display it live on a website.  
Instead of using static example data, AirAware uses a complete IoT data flow with hardware, embedded software, backend, frontend, and server infrastructure.

## Data Flow

```text
ESP32-S3
  │
  │ MQTT over WebSocket Secure (WSS)
  ▼
Cloudflare Tunnel
  ▼
MQTT/WebSocket Proxy
  ▼
Mosquitto MQTT Broker
  ▼
ASP.NET Backend
  ▼
React Frontend
