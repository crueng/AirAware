idf_component_register(
        SRCS
        "main.c"
        "wifi.c"
        "mqtt_manager.c"
        "Sensor.c"
        INCLUDE_DIRS "."
        REQUIRES
        nvs_flash
        esp_wifi
        esp_netif
        esp_http_server
        esp_event
        mqtt          # ← das fehlte
        esp_adc
        driver
)