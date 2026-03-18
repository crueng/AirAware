//
// Created by cruengeling on 12.03.2026.
//

#ifndef AIRAWARE_HTML_H
#define AIRAWARE_HTML_H

#endif // AIRAWARE_HTML_H

static const char *HTML_FORM =
	"<!DOCTYPE html><html><head>"
	"<meta charset='UTF-8'>"
	"<meta name='viewport' content='width=device-width,initial-scale=1'>"
	"<style>"
	"body{font-family:sans-serif;max-width:400px;margin:40px auto;padding:20px}"
	"input{width:100%;padding:10px;margin:8px 0;box-sizing:border-box;border:1px solid #ccc;border-radius:4px}"
	"button{width:100%;padding:12px;background:#0078d4;color:white;border:none;border-radius:4px;font-size:16px;cursor:pointer}"
	"</style></head><body>"
	"<h2>WLAN einrichten</h2>"
	"<form action='/connect' method='POST'>"
	"<label>SSID (Netzwerkname)</label>"
	"<input name='ssid' type='text' placeholder='Mein WLAN' required>"
	"<label>Passwort</label>"
	"<input name='pass' type='password' placeholder='Passwort'>"
	"<button type='submit'>Verbinden</button>"
	"</form></body></html>";
