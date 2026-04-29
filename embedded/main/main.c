#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "nvs_flash.h"
#include "esp_log.h"

#include "wifi.h"
#include "mqtt_manager.h"
#include "Sensor.h"

#define TAG                 "main"
#define SENSOR_INTERVAL_MS  30000

static bool s_mqtt_running = false;

// Wird aufgerufen sobald STA eine IP hat
static void on_wifi_connected(void)
{
	ESP_LOGI(TAG, "WiFi verbunden → starte MQTT");

	if (!s_mqtt_running) {
		bool ok = mqtt_start();

		if (ok) {
			s_mqtt_running = true;
			ESP_LOGI(TAG, "MQTT Start ausgelöst");
		} else {
			ESP_LOGE(TAG, "MQTT konnte nicht gestartet werden");
		}
	}
}

// Sensor Task alle 30s
static void sensor_task(void *pvParameters)
{
    float temp = 0.0f;
    float humidity = 0.0f;
    int mq2_raw = 0;
    float mq2_percent = 0.0f;

    while (true) {
        vTaskDelay(pdMS_TO_TICKS(SENSOR_INTERVAL_MS));

        if (!mqtt_is_connected()) {
            ESP_LOGW(TAG, "MQTT nicht bereit, überspringe...");
            continue;
        }

    	mqtt_publish_sensors(20, 40);

    	return;
        esp_err_t err_t = sht20_read_temperature(&temp);
        esp_err_t err_h = sht20_read_humidity(&humidity);
        esp_err_t err_mq2_raw = mq2_read_raw(&mq2_raw);
        esp_err_t err_mq2_percent = mq2_read_percent(&mq2_percent);

        if (err_t != ESP_OK) {
            ESP_LOGE(TAG, "Temperatur Fehler: %s", esp_err_to_name(err_t));
        }

        if (err_h != ESP_OK) {
            ESP_LOGE(TAG, "Humidity Fehler: %s", esp_err_to_name(err_h));
        }

        if (err_mq2_raw != ESP_OK) {
            ESP_LOGE(TAG, "MQ2 Raw Fehler: %s", esp_err_to_name(err_mq2_raw));
        }

        if (err_mq2_percent != ESP_OK) {
            ESP_LOGE(TAG, "MQ2 Percent Fehler: %s", esp_err_to_name(err_mq2_percent));
        }

        if (
            err_t == ESP_OK &&
            err_h == ESP_OK &&
            err_mq2_raw == ESP_OK &&
            err_mq2_percent == ESP_OK
        ) {
            ESP_LOGI(TAG, "Temp: %.2f °C", temp);
            ESP_LOGI(TAG, "Humidity: %.2f %%", humidity);
            ESP_LOGI(TAG, "MQ2 Raw: %d", mq2_raw);
            ESP_LOGI(TAG, "MQ2 Percent: %.2f %%", mq2_percent);

            mqtt_publish_sensors(20, 40);
        }
    }
}

void app_main(void)
{
    // 1. NVS
    esp_err_t ret = nvs_flash_init();

    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }

    ESP_ERROR_CHECK(ret);

    // 2. Sensoren initialisieren
    ESP_ERROR_CHECK(sht20_init());
    ESP_ERROR_CHECK(mq2_init());

    ESP_LOGI(TAG, "Sensoren initialisiert");

    // 3. WiFi Callback VOR init registrieren
    wifi_set_connected_callback(on_wifi_connected);

    // 4. SoftAP starten
    wifi_init_softap();

    // 5. Gespeicherte Credentials versuchen
	if (try_saved_credentials()) {
		ESP_LOGI(TAG, "Automatisch mit gespeichertem WLAN verbunden");

		if (!s_mqtt_running) {
			bool ok = mqtt_start();

			if (ok) {
				s_mqtt_running = true;
				ESP_LOGI(TAG, "MQTT Start ausgelöst");
			} else {
				ESP_LOGE(TAG, "MQTT konnte nicht gestartet werden");
			}
		}
	} else {
		ESP_LOGI(TAG, "Keine Credentials → bitte über http://192.168.4.1 einrichten");
	}

    // 6. Webserver immer aktiv
    start_webserver();
    ESP_LOGI(TAG, "Webserver läuft auf http://192.168.4.1");

    // 7. Sensor Task starten
    xTaskCreate(sensor_task, "sensor_task", 4096, NULL, 5, NULL);
}