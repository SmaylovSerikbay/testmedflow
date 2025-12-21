#!/bin/bash

echo "=== Миграция БД: Добавление room_number ==="

# Подключаемся к контейнеру PostgreSQL и выполняем миграцию
docker exec -i medwork-postgres psql -U postgres -d medflow << 'EOF'
-- Добавляем колонку room_number если её ещё нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'doctors' 
        AND column_name = 'room_number'
    ) THEN
        ALTER TABLE doctors ADD COLUMN room_number TEXT;
        RAISE NOTICE 'Колонка room_number добавлена в таблицу doctors';
    ELSE
        RAISE NOTICE 'Колонка room_number уже существует в таблице doctors';
    END IF;
END $$;

-- Проверяем структуру таблицы
\d doctors

-- Показываем врачей
SELECT id, name, specialty, room_number FROM doctors;
EOF

echo ""
echo "=== Миграция завершена! ==="
echo ""
echo "=== Перезапускаем backend ==="
docker-compose restart backend

echo ""
echo "=== Готово! ==="

