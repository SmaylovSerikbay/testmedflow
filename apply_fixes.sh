#!/bin/bash
cd ~/projects/testmedflow

echo "=== Обновление кода с GitHub ==="
git pull origin main || git pull origin master

echo ""
echo "=== Остановка контейнеров ==="
docker compose down

echo ""
echo "=== Пересборка и запуск с исправлениями ==="
docker compose up -d --build

echo ""
echo "=== Ожидание запуска (10 секунд) ==="
sleep 10

echo ""
echo "=== Статус контейнеров ==="
docker compose ps

echo ""
echo "=== Проверка подключения ==="
echo "Backend health:"
curl -s http://localhost:8080/health || echo "Backend не отвечает"
echo ""
echo "Frontend:"
curl -s http://localhost:5173 | head -5 || echo "Frontend не отвечает"

