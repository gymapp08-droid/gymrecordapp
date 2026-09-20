Write-Host "Stopping ALPHA local infrastructure..." -ForegroundColor Yellow
docker compose -f infrastructure/docker/docker-compose.yml down
Write-Host "Infrastructure stopped." -ForegroundColor Green
