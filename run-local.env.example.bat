@echo off
set "SPRING_PROFILES_ACTIVE=local"
set "SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/dms_lite"
set "SPRING_DATASOURCE_USERNAME=postgres"
set "SPRING_DATASOURCE_PASSWORD=change-me"

set "VITE_API_BASE_URL=http://localhost:8080/api"
set "VITE_DEMO_MODE=true"
set "VITE_DEMO_PASSWORD=Demo@2026"
set "APP_DEMO_PASSWORD=Demo@2026"
