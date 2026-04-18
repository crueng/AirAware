#!/usr/bin/env pwsh
# ??????????????????????????????????????????????
# AirAware – Build & Publish für Windows Server
# Erzeugt einen deploy/output-Ordner zum direkten Kopieren.
# ??????????????????????????????????????????????

$outputDir = Join-Path $PSScriptRoot "deploy" "output"

# Altes Build-Ergebnis aufräumen
if (Test-Path $outputDir) {
    Write-Host "Räume alten Build auf..." -ForegroundColor Yellow
    Remove-Item $outputDir -Recurse -Force
}

Write-Host "Publishe AirAware für win-x64..." -ForegroundColor Cyan

dotnet publish `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -o $outputDir

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build fehlgeschlagen!" -ForegroundColor Red
    exit 1
}

# appsettings.Production.json sicherstellen
$prodConfig = Join-Path $PSScriptRoot "appsettings.Production.json"
if (Test-Path $prodConfig) {
    Copy-Item $prodConfig $outputDir -Force
}

Write-Host ""
Write-Host "Fertig! Deploy-Ordner: $outputDir" -ForegroundColor Green
Write-Host ""
Write-Host "Auf den Server kopieren und starten:" -ForegroundColor Cyan
Write-Host "  1. deploy\output\ auf den Server kopieren (z.B. C:\AirAware\)"
Write-Host "  2. .\start.ps1 ausfuehren oder AirAware.exe direkt starten"
