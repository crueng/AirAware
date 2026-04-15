//
// Created by Connor  on 13.04.26.
//

#include "Sensor.h"

i2c_master_bus_handle_t bus_handle;
i2c_master_dev_handle_t sht20_handle;

 esp_err_t sht20_init(void)
{
	i2c_master_bus_config_t bus_config = {
		.i2c_port = I2C_PORT_NUM,
		.sda_io_num = I2C_SH20_SDA,
		.scl_io_num = I2C_SH20_SCL,
		.clk_source = I2C_CLK_SRC_DEFAULT,
		.glitch_ignore_cnt = 7,
		.flags.enable_internal_pullup = true,
	};

	ESP_ERROR_CHECK(i2c_new_master_bus(&bus_config, &bus_handle));

	i2c_device_config_t dev_config = {
		.dev_addr_length = I2C_ADDR_BIT_LEN_7,
		.device_address = SHT20_ADDR,
		.scl_speed_hz = I2C_FREQ_HZ,
	};

	ESP_ERROR_CHECK(i2c_master_bus_add_device(bus_handle, &dev_config, &sht20_handle));
	return ESP_OK;
}
esp_err_t sht20_read_raw(uint8_t cmd, uint16_t *raw_out)
{
	uint8_t rx[2] = {0};

	// Messkommando senden
	esp_err_t err = i2c_master_transmit(sht20_handle, &cmd, 1, 1000);
	if (err != ESP_OK) {
		return err;
	}

	// Auf Messung warten
	vTaskDelay(pdMS_TO_TICKS(100));

	// 2 Bytes lesen
	err = i2c_master_receive(sht20_handle, rx, sizeof(rx), 1000);
	if (err != ESP_OK) {
		return err;
	}

	uint16_t raw = ((uint16_t)rx[0] << 8) | rx[1];
	raw &= ~0x0003; // Statusbits löschen

	*raw_out = raw;
	return ESP_OK;
}

esp_err_t sht20_read_temperature(float *temp_c)
{
	uint16_t raw;
	esp_err_t err = sht20_read_raw(SHT20_CMD_TEMP, &raw);
	if (err != ESP_OK) {
		return err;
	}

	*temp_c = -46.85f + 175.72f * ((float)raw / 65536.0f);
	return ESP_OK;
}

esp_err_t sht20_read_humidity(float *rh)
{
	uint16_t raw;
	esp_err_t err = sht20_read_raw(SHT20_CMD_HUM, &raw);
	if (err != ESP_OK) {
		return err;
	}

	*rh = -6.0f + 125.0f * ((float)raw / 65536.0f);
	return ESP_OK;
}
