#!/bin/bash
cd ~/projects/testmedflow



echo ""
echo "=== Статус контейнеров ==="
docker compose ps

echo ""
echo "=== Логи backend (последние 30 строк) ==="
docker compose logs --tail=30 backend

echo ""
echo "=== Логи frontend (последние 20 строк) ==="
docker compose logs --tail=20 frontend

echo ""
echo "=== Готово! ==="

