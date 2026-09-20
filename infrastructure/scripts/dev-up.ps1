Write-Host "Starting ALPHA local infrastructure (PostgreSQL, Redis, MinIO)..." -ForegroundColor Cyan
docker compose -f infrastructure/docker/docker-compose.yml up -d
Write-Host "Infrastructure started. Checking container status..." -ForegroundColor Green
docker compose -f infrastructure/docker/docker-compose.yml ps
