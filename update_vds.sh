#!/bin/bash
cd ~/projects/testmedflow

echo "=== Обновление проекта из Git ==="
git pull origin main

echo ""
echo "=== Пересборка frontend контейнера ==="
docker compose build frontend --no-cache

echo ""
echo "=== Перезапуск frontend ==="
docker compose stop frontend
docker compose rm -f frontend
docker compose up -d frontend

echo ""
echo "=== Ожидание запуска (10 секунд) ==="
sleep 10

echo ""
echo "=== Статус контейнеров ==="
docker compose ps

echo ""
echo "=== Логи frontend (последние 20 строк) ==="
docker compose logs --tail=20 frontend

echo ""
echo "=== Готово! ==="

