//
// Created by Connor on 10.03.2026.
//

#ifndef AIRAWARE_WIFI_H
#define AIRAWARE_WIFI_H

#endif // AIRAWARE_WIFI_H

#include "esp_event.h"

static void event_handler(void *arg, esp_event_base_t event_base,
						   int32_t event_id, void *event_data);
void wifi_init_sta(void);