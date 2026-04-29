#pragma once
#include <stdbool.h>
#include "esp_http_server.h"

// ← typedef MUSS vor der Funktion stehen die ihn benutzt
typedef void (*wifi_connected_cb_t)(void);

void wifi_set_connected_callback(wifi_connected_cb_t cb);

void wifi_init_softap(void);
bool try_saved_credentials(void);
httpd_handle_t start_webserver(void);

// Diese drei müssen nicht public sein – nur intern in wifi.c gebraucht
// Aber falls du sie brauchst:
void wifi_event_handler(void *arg, esp_event_base_t base,
						int32_t event_id, void *event_data);
esp_err_t root_handler(httpd_req_t *req);
esp_err_t scan_handler(httpd_req_t *req);
esp_err_t connect_handler(httpd_req_t *req);