#include "mqtt_manager.h"
#include "esp_crt_bundle.h"
#include "esp_log.h"
#include "mqtt_client.h"

#include <stdio.h>

static const char *TAG = "mqtt";

static esp_mqtt_client_handle_t s_client = NULL;
static volatile bool s_connected = false;

static void mqtt_event_handler(
    void *arg,
    esp_event_base_t base,
    int32_t event_id,
    void *event_data
)
{
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)event_data;

    switch ((esp_mqtt_event_id_t)event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "MQTT verbunden");
            s_connected = true;
            break;

        case MQTT_EVENT_DISCONNECTED:
            ESP_LOGW(TAG, "MQTT getrennt");
            s_connected = false;
            break;

        case MQTT_EVENT_ERROR:
            ESP_LOGE(TAG, "MQTT Fehler");
            s_connected = false;

            if (event->error_handle != NULL) {
                ESP_LOGE(TAG, "error_type: %d",
                         event->error_handle->error_type);

                ESP_LOGE(TAG, "esp_tls_last_esp_err: 0x%x",
                         event->error_handle->esp_tls_last_esp_err);

                ESP_LOGE(TAG, "esp_tls_stack_err: 0x%x",
                         event->error_handle->esp_tls_stack_err);

                ESP_LOGE(TAG, "connect_return_code: %d",
                         event->error_handle->connect_return_code);
            }

            break;

        default:
            break;
    }
}

bool mqtt_start(void)
{
    if (s_client != NULL) {
        ESP_LOGW(TAG, "MQTT Client existiert bereits");
        return true;
    }

	esp_mqtt_client_config_t cfg = {
    	.broker = {
    		.address = {
    			.uri = MQTT_BROKER_URI,
			},
			.verification = {
				.crt_bundle_attach = esp_crt_bundle_attach,
			},
		},

		.credentials = {
			.client_id = MQTT_SENSOR_ID,
			.username = MQTT_USERNAME,
			.authentication = {
				.password = MQTT_PASSWORD,
			},
		},

		.network = {
			.reconnect_timeout_ms = 5000,
		},

		.session = {
			.keepalive = 60,
		},
	};


    s_client = esp_mqtt_client_init(&cfg);
    if (s_client == NULL) {
        ESP_LOGE(TAG, "MQTT Init fehlgeschlagen");
        return false;
    }

    esp_err_t err = esp_mqtt_client_register_event(
        s_client,
        ESP_EVENT_ANY_ID,
        mqtt_event_handler,
        NULL
    );

    if (err != ESP_OK) {
        ESP_LOGE(TAG, "MQTT Event Handler Fehler: %s", esp_err_to_name(err));
        esp_mqtt_client_destroy(s_client);
        s_client = NULL;
        return false;
    }

    err = esp_mqtt_client_start(s_client);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "MQTT Start Fehler: %s", esp_err_to_name(err));
        esp_mqtt_client_destroy(s_client);
        s_client = NULL;
        return false;
    }

    ESP_LOGI(TAG, "MQTT gestartet: %s", MQTT_BROKER_URI);
    return true;
}

void mqtt_stop(void)
{
    if (s_client != NULL) {
        esp_mqtt_client_stop(s_client);
        esp_mqtt_client_destroy(s_client);

        s_client = NULL;
        s_connected = false;
    }
}

bool mqtt_is_connected(void)
{
    return s_connected;
}

bool mqtt_publish_sensors(float temperature, float humidity)
{
    if (!s_connected || s_client == NULL) {
        ESP_LOGW(TAG, "MQTT nicht verbunden, Publish übersprungen");
        return false;
    }

    char payload[192];

    // Temperatur separat senden
    snprintf(
        payload,
        sizeof(payload),
        "{"
            "\"sensor_id\":\"%s\","
            "\"type\":\"temperature\","
            "\"temp_c\":%.1f"
        "}",
        MQTT_SENSOR_ID,
        temperature
    );

    int temp_msg_id = esp_mqtt_client_publish(
        s_client,
        MQTT_TOPIC_TEMP,
        payload,
        0,
        1,
        0
    );

    ESP_LOGI(TAG, "Temperature publish msg_id=%d payload=%s",
             temp_msg_id,
             payload);

    // Luftfeuchtigkeit separat senden
    snprintf(
        payload,
        sizeof(payload),
        "{"
            "\"sensor_id\":\"%s\","
            "\"type\":\"humidity\","
            "\"humidity_pct\":%.1f"
        "}",
        MQTT_SENSOR_ID,
        humidity
    );

    int humi_msg_id = esp_mqtt_client_publish(
        s_client,
        MQTT_TOPIC_HUMI,
        payload,
        0,
        1,
        0
    );

    ESP_LOGI(TAG, "Humidity publish msg_id=%d payload=%s",
             humi_msg_id,
             payload);

    return temp_msg_id >= 0 && humi_msg_id >= 0;
}