#pragma once

#ifndef AIRAWARE_SENSOR_H
#define AIRAWARE_SENSOR_H

#include <stdint.h>

#include "freertos/FreeRTOS.h"
#include "driver/i2c_master.h"
#include "driver/gpio.h"
#include "esp_err.h"
#include "esp_log.h"
#include "esp_adc/adc_oneshot.h"

// -------------------------
// SHT20 I2C
// -------------------------

#define I2C_SH20_SDA GPIO_NUM_21
#define I2C_SH20_SCL GPIO_NUM_47

#define I2C_PORT_NUM 0
#define I2C_FREQ_HZ 100000

#define SHT20_ADDR 0x40
#define SHT20_CMD_TEMP 0xF3
#define SHT20_CMD_HUM  0xF5

extern i2c_master_bus_handle_t bus_handle;
extern i2c_master_dev_handle_t sht20_handle;

esp_err_t sht20_init(void);
esp_err_t sht20_read_raw(uint8_t cmd, uint16_t *raw_out);
esp_err_t sht20_read_temperature(float *temp_c);
esp_err_t sht20_read_humidity(float *rh);

// -------------------------
// MQ2 ADC
// -------------------------

/*
   Achtung:
   ADC_CHANNEL_2 bei ADC_UNIT_2 ist NICHT automatisch GPIO2.
   Der genaue GPIO hängt beim ESP32-S3 von der ADC-Mapping-Tabelle ab.

   Wenn du GPIO4 verwenden willst, ist meistens ADC1_CHANNEL_3 korrekt.
*/

#define MQ2_ADC_UNIT    ADC_UNIT_1
#define MQ2_ADC_CHANNEL ADC_CHANNEL_3   // GPIO4 beim ESP32-S3
#define MQ2_ADC_ATTEN   ADC_ATTEN_DB_12
#define MQ2_ADC_WIDTH   ADC_BITWIDTH_12

extern adc_oneshot_unit_handle_t mq2_adc_handle;

esp_err_t mq2_init(void);
esp_err_t mq2_read_raw(int *raw_out);
esp_err_t mq2_read_percent(float *percent_out);

#endif // AIRAWARE_SENSOR_H