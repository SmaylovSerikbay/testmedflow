-- Миграция: Добавление номера кабинета для врачей
-- Дата: 2025-12-21
-- Описание: Добавляет поле room_number в таблицу doctors

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

-- Примеры обновления номеров кабинетов
-- UPDATE doctors SET room_number = '101' WHERE specialty = 'Терапевт';
-- UPDATE doctors SET room_number = '205' WHERE specialty = 'Офтальмолог';
-- UPDATE doctors SET room_number = '310' WHERE specialty = 'Невролог';
-- UPDATE doctors SET room_number = '401' WHERE specialty = 'Профпатолог';

COMMIT;

