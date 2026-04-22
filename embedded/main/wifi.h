#pragma once
#include "esp_http_server.h"

void wifi_event_handler(void *arg, esp_event_base_t base, int32_t event_id, void *event_data);

esp_err_t root_handler(httpd_req_t *req);

esp_err_t scan_handler(httpd_req_t *req);

esp_err_t connect_handler(httpd_req_t *req);

httpd_handle_t start_webserver(void);

void wifi_init_softap(void);

bool try_saved_credentials(void);