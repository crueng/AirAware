#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_http_server.h"
#include "nvs_flash.h"
#include "lwip/err.h"
#include "lwip/sys.h"
//#include "dns_server.h"  // Captive Portal DNS

#include "wifi.h"
// Konfiguration
#define AP_SSID        "ESP32-Setup"
#define AP_PASSWORD    ""       // Min. 8 Zeichen, oder "" für open
#define AP_CHANNEL     1
#define AP_MAX_CONN    4

#define WIFI_CONNECTED_BIT  BIT0
#define WIFI_FAIL_BIT       BIT1
#define WIFI_CONNECT_RETRIES 3

static wifi_connected_cb_t s_connected_cb = NULL;

void wifi_set_connected_callback(wifi_connected_cb_t cb)
{
	s_connected_cb = cb;
}

static const char *TAG = "wifi_prov";
static EventGroupHandle_t s_wifi_event_group;
static int s_retry_count = 0;
static char s_target_ssid[32]     = {0};
static char s_target_password[64] = {0};

// Web-UI (HTML)
static const char *HTML_PAGE =
"<!DOCTYPE html><html lang='de'><head>"
"<meta charset='UTF-8'>"
"<meta name='viewport' content='width=device-width,initial-scale=1'>"
"<title>ESP32 WiFi Setup</title>"
"<style>"
"  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600&display=swap');"
"  :root{"
"    --bg:#0a0e1a; --panel:#111827; --border:#1e3a5f;"
"    --accent:#00d4ff; --accent2:#0066cc; --text:#c8d8e8; --dim:#4a6080;"
"  }"
"  *{box-sizing:border-box;margin:0;padding:0}"
"  body{background:var(--bg);color:var(--text);font-family:'Rajdhani',sans-serif;"
"    min-height:100vh;display:flex;align-items:center;justify-content:center;"
"    background-image:radial-gradient(ellipse at 20% 50%,#0d1f3c 0%,transparent 60%),"
"      radial-gradient(ellipse at 80% 20%,#001a33 0%,transparent 50%);}"
"  .card{background:var(--panel);border:1px solid var(--border);border-radius:4px;"
"    padding:2.5rem;width:100%;max-width:420px;position:relative;overflow:hidden;}"
"  .card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;"
"    background:linear-gradient(90deg,transparent,var(--accent),transparent);}"
"  .card::after{content:'';position:absolute;inset:0;pointer-events:none;"
"    background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,.015) 2px,rgba(0,212,255,.015) 4px);}"
"  .logo{font-family:'Share Tech Mono',monospace;color:var(--accent);"
"    font-size:.75rem;letter-spacing:.2em;margin-bottom:.4rem;opacity:.7;}"
"  h1{font-size:1.6rem;font-weight:600;letter-spacing:.05em;color:#e8f4ff;margin-bottom:.4rem;}"
"  .subtitle{font-size:.85rem;color:var(--dim);margin-bottom:2rem;font-family:'Share Tech Mono',monospace;}"
"  label{display:block;font-size:.8rem;letter-spacing:.12em;color:var(--accent);"
"    margin-bottom:.4rem;text-transform:uppercase;font-weight:600;}"
"  input{width:100%;background:#0d1420;border:1px solid var(--border);border-radius:3px;"
"    padding:.75rem 1rem;color:var(--text);font-family:'Share Tech Mono',monospace;"
"    font-size:.9rem;outline:none;transition:border-color .2s;margin-bottom:1.2rem;}"
"  input:focus{border-color:var(--accent);box-shadow:0 0 0 2px rgba(0,212,255,.1);}"
"  .networks{margin-bottom:1.2rem;}"
"  .net-item{background:#0d1420;border:1px solid var(--border);border-radius:3px;"
"    padding:.6rem 1rem;margin-bottom:.4rem;cursor:pointer;display:flex;"
"    align-items:center;gap:.75rem;transition:border-color .15s,background .15s;}"
"  .net-item:hover{border-color:var(--accent2);background:#111f35;}"
"  .net-item.selected{border-color:var(--accent);background:#0a1f35;}"
"  .sig{font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--accent);}"
"  .ssid-name{flex:1;font-size:.9rem;}"
"  .lock{font-size:.75rem;color:var(--dim);}"
"  button{width:100%;background:linear-gradient(135deg,var(--accent2),var(--accent));"
"    border:none;border-radius:3px;padding:.85rem;color:#000;font-family:'Rajdhani',sans-serif;"
"    font-size:1rem;font-weight:600;letter-spacing:.1em;cursor:pointer;text-transform:uppercase;"
"    transition:opacity .2s,transform .1s;margin-top:.5rem;}"
"  button:hover{opacity:.9;} button:active{transform:scale(.98);}"
"  #status{margin-top:1.2rem;padding:.75rem;border-radius:3px;font-family:'Share Tech Mono',monospace;"
"    font-size:.8rem;display:none;text-align:center;}"
"  #status.ok{background:#002a1a;border:1px solid #00aa44;color:#00dd66;display:block;}"
"  #status.err{background:#1a0008;border:1px solid #aa0022;color:#ff3355;display:block;}"
"  #status.info{background:#001a2a;border:1px solid var(--border);color:var(--accent);display:block;}"
"  .scan-btn{background:none;border:1px solid var(--border);color:var(--dim);"
"    font-size:.75rem;padding:.3rem .8rem;border-radius:3px;cursor:pointer;"
"    letter-spacing:.1em;width:auto;margin-top:0;margin-bottom:.6rem;}"
"  .scan-btn:hover{border-color:var(--accent2);color:var(--text);}"
"  .divider{border:none;border-top:1px solid var(--border);margin:1rem 0;}"
"</style></head><body>"
"<div class='card'>"
"  <div class='logo'>// ESP32-S3 &bull; NETWORK PROVISIONING</div>"
"  <h1>WiFi Setup</h1>"
"  <p class='subtitle'>_ connect to network</p>"
"  <button class='scan-btn' onclick='scanNetworks()'>&#x27F3; Netzwerke scannen</button>"
"  <div class='networks' id='networks'></div>"
"  <hr class='divider'>"
"  <label for='ssid'>SSID</label>"
"  <input type='text' id='ssid' placeholder='Netzwerkname' autocomplete='off'>"
"  <label for='pass'>Passwort</label>"
"  <input type='password' id='pass' placeholder='Passwort' autocomplete='off'>"
"  <button onclick='connect()'>Verbinden &rarr;</button>"
"  <div id='status'></div>"
"</div>"
"<script>"
"function setStatus(msg,cls){var s=document.getElementById('status');"
"  s.textContent=msg;s.className=cls;}"
"function selectNet(el,ssid){"
"  document.querySelectorAll('.net-item').forEach(e=>e.classList.remove('selected'));"
"  el.classList.add('selected');"
"  document.getElementById('ssid').value=ssid;"
"  document.getElementById('pass').focus();}"
"function scanNetworks(){"
"  setStatus('Scanne...','info');"
"  fetch('/scan').then(r=>r.json()).then(nets=>{"
"    var c=document.getElementById('networks');c.innerHTML='';"
"    nets.forEach(n=>{"
"      var bars=n.rssi>-60?'▉▉▉▉':n.rssi>-75?'▉▉▉░':n.rssi>-85?'▉▉░░':'▉░░░';"
"      var d=document.createElement('div');d.className='net-item';"
"      d.innerHTML=\"<span class='sig'>\"+bars+\"</span><span class='ssid-name'>\"+n.ssid+\"</span>\""
"        +\"<span class='lock'>\"+(n.auth?'&#x1F512;':'')+\"</span>\";"
"      d.onclick=function(){selectNet(d,n.ssid);};"
"      c.appendChild(d);});"
"    setStatus(nets.length+' Netzwerke gefunden','ok');"
"  }).catch(()=>setStatus('Scan fehlgeschlagen','err'));}"
"function connect(){"
"  var s=document.getElementById('ssid').value.trim();"
"  var p=document.getElementById('pass').value;"
"  if(!s){setStatus('Bitte SSID eingeben','err');return;}"
"  setStatus('Verbinde...','info');"
"  fetch('/connect',{method:'POST',"
"    headers:{'Content-Type':'application/json'},"
"    body:JSON.stringify({ssid:s,password:p})})"
"  .then(r=>r.json()).then(d=>{"
"    if(d.status==='ok')setStatus('Verbunden! IP: '+d.ip,'ok');"
"    else setStatus('Fehler: '+d.message,'err');"
"  }).catch(()=>setStatus('Verbindung fehlgeschlagen','err'));}"
"window.onload=scanNetworks;"
"</script></body></html>";

// Event Handler
void wifi_event_handler(void *arg, esp_event_base_t base, int32_t event_id, void *event_data)
{
    if (base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START)
    {
        esp_wifi_connect();
    }
	else if (base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED)
	{
        if (s_retry_count < WIFI_CONNECT_RETRIES)
        {
            esp_wifi_connect();
            s_retry_count++;
            ESP_LOGI(TAG, "Retry %d/%d...", s_retry_count, WIFI_CONNECT_RETRIES);
        }
    	else
        {
        	if (s_wifi_event_group == NULL)
        	{
        		s_wifi_event_group = xEventGroupCreate();
        		assert(s_wifi_event_group);
        	}
        	xEventGroupSetBits(s_wifi_event_group, WIFI_FAIL_BIT);
        	if (s_connected_cb)
        	{
        		s_connected_cb();
        	}
        }
    }
	else if (base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP)
	{
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        ESP_LOGI(TAG, "Got IP: " IPSTR, IP2STR(&event->ip_info.ip));
        s_retry_count = 0;
        xEventGroupSetBits(s_wifi_event_group, WIFI_CONNECTED_BIT);
    }
}

// HTTP Handler: Root /
esp_err_t root_handler(httpd_req_t *req)
{
    httpd_resp_set_type(req, "text/html");
    httpd_resp_send(req, HTML_PAGE, HTTPD_RESP_USE_STRLEN);
    return ESP_OK;
}

// HTTP Handler: /scan
esp_err_t scan_handler(httpd_req_t *req)
{
    uint16_t ap_count = 0;
    wifi_scan_config_t scan_cfg = {.show_hidden = false, .scan_type = WIFI_SCAN_TYPE_ACTIVE};

    esp_wifi_scan_start(&scan_cfg, true);  // blocking scan
    esp_wifi_scan_get_ap_num(&ap_count);

    if (ap_count > 20) ap_count = 20;
    wifi_ap_record_t *ap_list = malloc(sizeof(wifi_ap_record_t) * ap_count);
    esp_wifi_scan_get_ap_records(&ap_count, ap_list);

    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr_chunk(req, "[");
    for (int i = 0; i < ap_count; i++) {
        char buf[128];
        snprintf(buf, sizeof(buf),
            "%s{\"ssid\":\"%s\",\"rssi\":%d,\"auth\":%s}",
            i ? "," : "",
            (char *)ap_list[i].ssid,
            ap_list[i].rssi,
            ap_list[i].authmode != WIFI_AUTH_OPEN ? "true" : "false");
        httpd_resp_sendstr_chunk(req, buf);
    }
    httpd_resp_sendstr_chunk(req, "]");
    httpd_resp_sendstr_chunk(req, NULL);  // End chunked response

    free(ap_list);
    return ESP_OK;
}

// HTTP Handler: /connect
esp_err_t connect_handler(httpd_req_t *req)
{
    char buf[256] = {0};
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Empty body");
        return ESP_FAIL;
    }

    // Simplen JSON-Parser (kein cJSON nötig für dieses Format)
    char *ssid_start = strstr(buf, "\"ssid\":\"");
    char *pass_start = strstr(buf, "\"password\":\"");

    if (!ssid_start) {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing ssid");
        return ESP_FAIL;
    }

    ssid_start += 8;
    char *ssid_end = strchr(ssid_start, '"');
    if (ssid_end) { *ssid_end = '\0'; strncpy(s_target_ssid, ssid_start, sizeof(s_target_ssid) - 1); }

    if (pass_start) {
        pass_start += 12;
        char *pass_end = strchr(pass_start, '"');
        if (pass_end) { *pass_end = '\0'; strncpy(s_target_password, pass_start, sizeof(s_target_password) - 1); }
    }

    ESP_LOGI(TAG, "Connecting to SSID: %s", s_target_ssid);

    // STA konfigurieren und verbinden
    s_wifi_event_group = xEventGroupCreate();
    s_retry_count = 0;

    wifi_config_t sta_cfg = {0};
    strncpy((char *)sta_cfg.sta.ssid,     s_target_ssid,     sizeof(sta_cfg.sta.ssid));
    strncpy((char *)sta_cfg.sta.password, s_target_password, sizeof(sta_cfg.sta.password));
    sta_cfg.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

    esp_wifi_set_mode(WIFI_MODE_APSTA);  // AP bleibt aktiv während Verbindungsversuch
    esp_wifi_set_config(WIFI_IF_STA, &sta_cfg);
    esp_wifi_connect();

    // Auf Ergebnis warten (max. 10 Sekunden)
    EventBits_t bits = xEventGroupWaitBits(s_wifi_event_group,
        WIFI_CONNECTED_BIT | WIFI_FAIL_BIT, pdFALSE, pdFALSE,
        pdMS_TO_TICKS(10000));

    httpd_resp_set_type(req, "application/json");

    if (bits & WIFI_CONNECTED_BIT) {
        esp_netif_ip_info_t ip_info;
        esp_netif_t *netif = esp_netif_get_handle_from_ifkey("WIFI_STA_DEF");
        esp_netif_get_ip_info(netif, &ip_info);

        char resp[128];
        snprintf(resp, sizeof(resp),
            "{\"status\":\"ok\",\"ip\":\"" IPSTR "\"}",
            IP2STR(&ip_info.ip));
        httpd_resp_sendstr(req, resp);

        ESP_LOGI(TAG, "Successfully connected! Saving credentials to NVS...");
        // Credentials in NVS speichern
        nvs_handle_t nvs;
        if (nvs_open("wifi_creds", NVS_READWRITE, &nvs) == ESP_OK) {
            nvs_set_str(nvs, "ssid",     s_target_ssid);
            nvs_set_str(nvs, "password", s_target_password);
            nvs_commit(nvs);
            nvs_close(nvs);
        }
    } else {
        httpd_resp_sendstr(req, "{\"status\":\"error\",\"message\":\"Verbindung fehlgeschlagen\"}");
    }

    vEventGroupDelete(s_wifi_event_group);
    return ESP_OK;
}

// HTTP Server starten
httpd_handle_t start_webserver(void)
{
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.lru_purge_enable = true;
    config.uri_match_fn = httpd_uri_match_wildcard;

    httpd_handle_t server = NULL;
    ESP_ERROR_CHECK(httpd_start(&server, &config));

    httpd_uri_t uri_root    = { .uri = "/",        .method = HTTP_GET,  .handler = root_handler };
    httpd_uri_t uri_scan    = { .uri = "/scan",     .method = HTTP_GET,  .handler = scan_handler };
    httpd_uri_t uri_connect = { .uri = "/connect",  .method = HTTP_POST, .handler = connect_handler };

    // Captive Portal: alle unbekannten URLs auf Root umleiten
    httpd_uri_t uri_catch_all = { .uri = "/*", .method = HTTP_GET, .handler = root_handler };

    httpd_register_uri_handler(server, &uri_root);
    httpd_register_uri_handler(server, &uri_scan);
    httpd_register_uri_handler(server, &uri_connect);
    httpd_register_uri_handler(server, &uri_catch_all);

    return server;
}

// Soft-AP initialisieren
void wifi_init_softap(void)
{
	esp_err_t err = esp_event_loop_create_default();
	if (err != ESP_OK && err != ESP_ERR_INVALID_STATE) {
		ESP_ERROR_CHECK(err);
	}

    ESP_ERROR_CHECK(esp_netif_init());
    //ESP_ERROR_CHECK(esp_event_loop_create_default());

	esp_netif_create_default_wifi_ap();
	esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_event_handler_instance_register(
        WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL, NULL));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(
        IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL, NULL));

    wifi_config_t ap_config = {
        .ap = {
            .ssid            = AP_SSID,
            .ssid_len        = strlen(AP_SSID),
            .channel         = AP_CHANNEL,
            .password        = AP_PASSWORD,
            .max_connection  = AP_MAX_CONN,
            .authmode        = strlen(AP_PASSWORD) ? WIFI_AUTH_WPA2_PSK : WIFI_AUTH_OPEN,
        },
    };

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_APSTA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_AP, &ap_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "AP gestartet: SSID='%s'  IP=192.168.4.1", AP_SSID);
}

// Gespeicherte Credentials aus NVS laden
bool try_saved_credentials(void)
{
    nvs_handle_t nvs;
    char ssid[32] = {0}, pass[64] = {0};
    size_t ssid_len = sizeof(ssid), pass_len = sizeof(pass);

    if (nvs_open("wifi_creds", NVS_READONLY, &nvs) != ESP_OK) return false;

    bool valid = (nvs_get_str(nvs, "ssid", ssid, &ssid_len) == ESP_OK && strlen(ssid) > 0);
    nvs_get_str(nvs, "password", pass, &pass_len);
    nvs_close(nvs);

    if (!valid) return false;

    ESP_LOGI(TAG, "Gespeicherte Credentials gefunden, versuche '%s'...", ssid);
    strncpy(s_target_ssid,     ssid, sizeof(s_target_ssid));
    strncpy(s_target_password, pass, sizeof(s_target_password));

    s_wifi_event_group = xEventGroupCreate();
    wifi_config_t sta_cfg = {0};
    strncpy((char *)sta_cfg.sta.ssid,     ssid, sizeof(sta_cfg.sta.ssid));
    strncpy((char *)sta_cfg.sta.password, pass,  sizeof(sta_cfg.sta.password));
    sta_cfg.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

    esp_wifi_set_config(WIFI_IF_STA, &sta_cfg);
    esp_wifi_connect();

    EventBits_t bits = xEventGroupWaitBits(s_wifi_event_group,
        WIFI_CONNECTED_BIT | WIFI_FAIL_BIT, pdFALSE, pdFALSE, pdMS_TO_TICKS(8000));

    vEventGroupDelete(s_wifi_event_group);
    return (bits & WIFI_CONNECTED_BIT) != 0;
}