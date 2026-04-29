#pragma once

#include <stdbool.h>

#define MQTT_BROKER_URI   "wss://mqtt.air-aware.de:443/"
#define MQTT_USERNAME     "esp32-user"
#define MQTT_PASSWORD     "SensorData2026"
#define MQTT_SENSOR_ID    "esp32-01"

#define MQTT_TOPIC_TEMP   "esp32/sensor/temperature"
#define MQTT_TOPIC_HUMI   "esp32/sensor/humidity"

bool mqtt_start(void);
void mqtt_stop(void);
bool mqtt_is_connected(void);

bool mqtt_publish_sensors(float temperature, float humidity);