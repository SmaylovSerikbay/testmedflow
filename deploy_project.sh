#!/bin/bash
set -e

echo "=== Развертывание проекта testmedflow ==="
echo ""

# Переходим в директорию projects
cd ~/projects || mkdir -p ~/projects && cd ~/projects

# Проверяем, существует ли директория проекта
if [ -d "testmedflow" ]; then
    echo "Директория testmedflow уже существует. Обновляю проект..."
    cd testmedflow
    git pull origin main || git pull origin master
else
    echo "Клонирую репозиторий..."
    git clone https://github.com/SmaylovSerikbay/testmedflow.git
    cd testmedflow
fi

echo ""
echo "=== Проверка наличия Docker и Docker Compose ==="
docker --version
docker compose version || docker-compose --version

echo ""
echo "=== Проверка занятости портов ==="
netstat -tuln | grep -E ':5432|:8080|:5173' || echo "Порты свободны"

echo ""
echo "=== Остановка старых контейнеров (если есть) ==="
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || echo "Нет запущенных контейнеров"

echo ""
echo "=== Сборка и запуск проекта ==="
docker compose up -d --build || docker-compose up -d --build

echo ""
echo "=== Статус контейнеров ==="
docker compose ps || docker-compose ps

echo ""
echo "=== Логи последних 20 строк ==="
docker compose logs --tail=20 || docker-compose logs --tail=20

echo ""
echo "=== Развертывание завершено ==="
echo "Проверьте статус контейнеров командой: docker compose ps"
echo "Логи: docker compose logs -f"

