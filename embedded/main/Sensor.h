#pragma once
//
// Created by Connor  on 13.04.26.
//

#ifndef AIRAWARE_SENSOR_H
#define AIRAWARE_SENSOR_H

#endif // AIRAWARE_SENSOR_H

#include "freertos/FreeRTOS.h"
#include "driver/i2c_master.h"
#include "esp_log.h"

#define I2C_SH20_SDA GPIO_NUM_21
#define I2C_SH20_SCL GPIO_NUM_47

// Bus
#define I2C_PORT_NUM 0
#define I2C_FREQ_HZ 100000

#define SHT20_ADDR 0x40
#define SHT20_CMD_TEMP 0xF3
#define SHT20_CMD_HUM 0xF5

extern i2c_master_bus_handle_t bus_handle;
extern i2c_master_dev_handle_t sht20_handle;

esp_err_t sht20_init(void);

esp_err_t sht20_read_raw(uint8_t cmd, uint16_t *raw_out);

esp_err_t sht20_read_temperature(float *temp_c);

esp_err_t sht20_read_humidity(float *rh);