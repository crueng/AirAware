#include "hal/gpio_types.h"
#include "freertos/FreeRTOS.h"
#include <stdio.h>
#include <stdbool.h>
#include <unistd.h>
#include <driver/gpio.h>

#define PIN GPIO_NUM_4

void app_main(void)
{
	gpio_config_t io = {
		.pin_bit_mask = 1ULL << PIN,
		.mode = GPIO_MODE_OUTPUT,
		.pull_up_en = GPIO_PULLUP_DISABLE,
		.pull_down_en = GPIO_PULLDOWN_DISABLE,
		.intr_type = GPIO_INTR_DISABLE,
	};
	
	gpio_config(&io);
	
    while (true)
    {
		gpio_set_level(PIN, 1);
		vTaskDelay(pdMS_TO_TICKS(500));
		gpio_set_level(PIN, 0);
		vTaskDelay(pdMS_TO_TICKS(200));
    }
}
