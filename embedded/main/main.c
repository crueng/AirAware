#include "freertos/FreeRTOS.h"
#include "hal/gpio_types.h"
#include "nvs_flash.h"
#include <driver/gpio.h>
#include <stdbool.h>
#include <stdio.h>
#include <unistd.h>

#include "esp_wifi.h"
#include "wifi.h"
#include "hosting.h"

#define PIN GPIO_NUM_4

void app_main(void) {
	//gpio_config_t io = {
	//	.pin_bit_mask = 1ULL << PIN,
	//	.mode = GPIO_MODE_OUTPUT,
	//	.pull_up_en = GPIO_PULLUP_DISABLE,
	//	.pull_down_en = GPIO_PULLDOWN_DISABLE,
	//	.intr_type = GPIO_INTR_DISABLE,
	//};

	//gpio_config(&io);

	// NVS (Non-Volatile Storage) initialisieren – wird von WiFi benötigt
	//esp_err_t ret = nvs_flash_init();
	//if (ret == ESP_ERR_NVS_NO_FREE_PAGES ||
	//	ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
	//	ESP_ERROR_CHECK(nvs_flash_erase());
	//	ret = nvs_flash_init();
	//}
	//ESP_ERROR_CHECK(ret);

	//wifi_init_sta();

	//wifi_ap_record_t ap_info;
	//esp_err_t ret1 = esp_wifi_sta_get_ap_info(&ap_info);

	//if (ret1 == ESP_OK)
	//{
	//	gpio_set_level(PIN, 1);
	//}
	//else
	//{
	//	gpio_set_level(PIN, 1);
	//	vTaskDelay(pdMS_TO_TICKS(1000));
	//	gpio_set_level(PIN, 0);
	//}
	//Initialize NVS
	esp_err_t ret = nvs_flash_init();
	if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
		ESP_ERROR_CHECK(nvs_flash_erase());
		ret = nvs_flash_init();
	}
	ESP_ERROR_CHECK(ret);
	wifiInitSoftAp();
}
