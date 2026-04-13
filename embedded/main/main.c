#include "freertos/FreeRTOS.h"
#include "hal/gpio_types.h"
#include "nvs_flash.h"
#include "esp_log.h"
#include "esp_adc/adc_oneshot.h"
#include "driver/i2c_master.h"

#include <driver/gpio.h>
#include <stdbool.h>
#include <stdio.h>
#include <unistd.h>

#include "esp_wifi.h"
#include "wifi.h"
#include "hosting.h"
#include "Sensor.h"

#define PIN GPIO_NUM_13

void app_main(void)
{
	ESP_ERROR_CHECK(sht20_init());

	ESP_LOGI("I2C", "Scanning...");
	for (uint8_t addr = 1; addr < 127; addr++) {
		i2c_device_config_t scan_cfg = {
			.dev_addr_length = I2C_ADDR_BIT_LEN_7,
			.device_address = addr,
			.scl_speed_hz = I2C_FREQ_HZ,
		};
		i2c_master_dev_handle_t scan_handle;
		esp_err_t err = i2c_master_bus_add_device(bus_handle, &scan_cfg, &scan_handle);
		if (err == ESP_OK) {
			uint8_t dummy;
			err = i2c_master_receive(scan_handle, &dummy, 1, 100);
			if (err == ESP_OK) {
				ESP_LOGI("I2C", "Gerät gefunden auf Adresse: 0x%02X", addr);
			}
			i2c_master_bus_rm_device(scan_handle);
		}
	}
	esp_err_t ret = nvs_flash_init();
	if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
		ESP_ERROR_CHECK(nvs_flash_erase());
		ret = nvs_flash_init();
	}
	ESP_ERROR_CHECK(ret);
	wifiInitSoftAp();

	ESP_LOGI("", "Wifi Initialized");

	gpio_config_t io = {
		.mode = GPIO_MODE_INPUT,
		.pin_bit_mask = 1ULL << PIN,
		.pull_up_en = GPIO_PULLUP_DISABLE,
		.pull_down_en = GPIO_PULLDOWN_DISABLE,
		.intr_type = GPIO_INTR_DISABLE
	};

	gpio_config(&io);
	ESP_LOGI("","GPIO Initialized");

	adc_oneshot_unit_handle_t adc_handle;
	adc_oneshot_unit_init_cfg_t init_cfg = {
		.unit_id = ADC_UNIT_2,
	};
	adc_oneshot_new_unit(&init_cfg, &adc_handle);

	adc_oneshot_chan_cfg_t chan_cfg = {
		.atten = ADC_ATTEN_DB_12,    // 0-3.3V Messbereich
		.bitwidth = ADC_BITWIDTH_12, // 12-bit → Werte 0-4095
	};
	adc_oneshot_config_channel(adc_handle, ADC_CHANNEL_2, &chan_cfg);

	int raw_value = 0;
	float temp_c = 0;
	float humidity = 0;
	while (true) {

		adc_oneshot_read(adc_handle, ADC_CHANNEL_2, &raw_value);
		esp_err_t err_t = sht20_read_temperature(&temp_c);
		esp_err_t err_h = sht20_read_humidity(&humidity);

		if (err_t != ESP_OK) {
			ESP_LOGE("SHT20", "Temperatur Fehler: %s", esp_err_to_name(err_t));
		}
		if (err_h != ESP_OK) {
			ESP_LOGE("SHT20", "Humidity Fehler: %s", esp_err_to_name(err_h));
		}

		ESP_LOGI("MQ2", "Air quality: %d", raw_value);
		ESP_LOGI("SHT20", "Temperature in C: %.2f", temp_c);
		ESP_LOGI("SHT20", "Humidity in %: %.2f\n", humidity);
		vTaskDelay(pdMS_TO_TICKS(1000));
	}
}