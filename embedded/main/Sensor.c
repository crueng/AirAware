#include "Sensor.h"

// -------------------------
// Globale Handles
// -------------------------

i2c_master_bus_handle_t bus_handle;
i2c_master_dev_handle_t sht20_handle;

adc_oneshot_unit_handle_t mq2_adc_handle;

// -------------------------
// SHT20
// -------------------------

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

    esp_err_t err = i2c_new_master_bus(&bus_config, &bus_handle);
    if (err != ESP_OK) {
        return err;
    }

    i2c_device_config_t dev_config = {
        .dev_addr_length = I2C_ADDR_BIT_LEN_7,
        .device_address = SHT20_ADDR,
        .scl_speed_hz = I2C_FREQ_HZ,
    };

    err = i2c_master_bus_add_device(bus_handle, &dev_config, &sht20_handle);
    if (err != ESP_OK) {
        return err;
    }

    return ESP_OK;
}

esp_err_t sht20_read_raw(uint8_t cmd, uint16_t *raw_out)
{
    if (raw_out == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    uint8_t rx[2] = {0};

    esp_err_t err = i2c_master_transmit(sht20_handle, &cmd, 1, 1000);
    if (err != ESP_OK) {
        return err;
    }

    vTaskDelay(pdMS_TO_TICKS(100));

    err = i2c_master_receive(sht20_handle, rx, sizeof(rx), 1000);
    if (err != ESP_OK) {
        return err;
    }

    uint16_t raw = ((uint16_t)rx[0] << 8) | rx[1];
    raw &= ~0x0003;

    *raw_out = raw;
    return ESP_OK;
}

esp_err_t sht20_read_temperature(float *temp_c)
{
    if (temp_c == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    uint16_t raw = 0;
    esp_err_t err = sht20_read_raw(SHT20_CMD_TEMP, &raw);
    if (err != ESP_OK) {
        return err;
    }

    *temp_c = -46.85f + 175.72f * ((float)raw / 65536.0f);
    return ESP_OK;
}

esp_err_t sht20_read_humidity(float *rh)
{
    if (rh == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    uint16_t raw = 0;
    esp_err_t err = sht20_read_raw(SHT20_CMD_HUM, &raw);
    if (err != ESP_OK) {
        return err;
    }

    *rh = -6.0f + 125.0f * ((float)raw / 65536.0f);
    return ESP_OK;
}

// -------------------------
// MQ2
// -------------------------

esp_err_t mq2_init(void)
{
    adc_oneshot_unit_init_cfg_t init_cfg = {
        .unit_id = MQ2_ADC_UNIT,
    };

    esp_err_t err = adc_oneshot_new_unit(&init_cfg, &mq2_adc_handle);
    if (err != ESP_OK) {
        return err;
    }

    adc_oneshot_chan_cfg_t chan_cfg = {
        .atten = MQ2_ADC_ATTEN,
        .bitwidth = MQ2_ADC_WIDTH,
    };

    err = adc_oneshot_config_channel(mq2_adc_handle, MQ2_ADC_CHANNEL, &chan_cfg);
    if (err != ESP_OK) {
        return err;
    }

    return ESP_OK;
}

esp_err_t mq2_read_raw(int *raw_out)
{
    if (raw_out == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    return adc_oneshot_read(mq2_adc_handle, MQ2_ADC_CHANNEL, raw_out);
}

esp_err_t mq2_read_percent(float *percent_out)
{
    if (percent_out == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    int raw = 0;
    esp_err_t err = mq2_read_raw(&raw);
    if (err != ESP_OK) {
        return err;
    }

    /*
       12-bit ADC:
       0    -> 0%
       4095 -> 100%

       Das ist KEIN echter ppm-Wert.
       Das ist nur ein grober relativer Prozentwert.
    */
    *percent_out = ((float)raw / 4095.0f) * 100.0f;

    return ESP_OK;
}