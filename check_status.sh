#!/bin/bash
echo "=== Searching for project directory ==="
find ~ -name "docker-compose.yml" 2>/dev/null | head -n 5
echo ""
echo "=== Docker Containers Status ==="
docker ps
echo ""
# Try to run docker-compose logs from common locations if found
PROJECT_DIR=$(find ~ -name "docker-compose.yml" 2>/dev/null | head -n 1 | xargs dirname)
if [ -n "$PROJECT_DIR" ]; then
  echo "=== Project found in $PROJECT_DIR ==="
  cd "$PROJECT_DIR"
  echo "=== Backend Logs (last 50 lines) ==="
  docker compose logs backend --tail=50
  echo ""
  echo "=== Frontend Logs (last 50 lines) ==="
  docker compose logs frontend --tail=50
else
  echo "=== Project directory not found ==="
fi
