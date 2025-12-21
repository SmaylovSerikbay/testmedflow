#!/bin/bash
cd ~/projects/testmedflow

echo "=== Обновление проекта из Git ==="
git pull origin main

echo ""
echo "=== Пересборка backend контейнера ==="
docker compose build backend --no-cache

echo ""
echo "=== Перезапуск backend ==="
docker compose stop backend
docker compose rm -f backend
docker compose up -d backend

echo ""
echo "=== Ожидание запуска backend (5 секунд) ==="
sleep 5

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
echo "=== Логи backend (последние 30 строк) ==="
docker compose logs --tail=30 backend

echo ""
echo "=== Логи frontend (последние 20 строк) ==="
docker compose logs --tail=20 frontend

echo ""
echo "=== Готово! ==="

