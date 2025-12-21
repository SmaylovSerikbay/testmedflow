#!/bin/bash
cd ~/projects/testmedflow

echo "=== Обновление проекта из Git ==="
git pull origin main

echo ""
echo "=== Перезапуск backend ==="
docker compose down

echo ""
echo "=== Перезапуск backend ==="
docker compose up -d --build

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

