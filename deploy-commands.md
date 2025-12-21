# Команды для обновления на VDS

## Быстрое обновление (если уже на сервере)

```bash
cd /path/to/testmedflow
git pull origin main
docker-compose build --no-cache
docker-compose down
docker-compose up -d
docker-compose logs --tail=50
```

## Обновление через SSH (с локальной машины)

```bash
# Подключитесь к серверу и выполните:
ssh user@your-vds-ip

# Затем выполните команды обновления:
cd /path/to/testmedflow
git pull origin main
docker-compose build --no-cache
docker-compose down
docker-compose up -d
docker-compose logs --tail=50
```

## Одной строкой (если используете SSH ключ)

```bash
ssh user@your-vds-ip "cd /path/to/testmedflow && git pull origin main && docker-compose build --no-cache && docker-compose down && docker-compose up -d"
```

## Проверка статуса

```bash
docker-compose ps
docker-compose logs frontend --tail=50
docker-compose logs backend --tail=50
```

## Если нужно обновить только frontend или backend

```bash
# Только frontend
docker-compose build frontend
docker-compose up -d frontend

# Только backend
docker-compose build backend
docker-compose up -d backend
```

## Откат изменений (если что-то пошло не так)

```bash
git log --oneline  # Посмотреть последние коммиты
git reset --hard HEAD~1  # Откатить последний коммит
docker-compose build --no-cache
docker-compose up -d
```

