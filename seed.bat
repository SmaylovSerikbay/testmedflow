@echo off
REM ============================================
REM Скрипт автоматического заполнения БД
REM ============================================

echo.
echo ================================================
echo   АВТОМАТИЧЕСКОЕ ЗАПОЛНЕНИЕ БАЗЫ ДАННЫХ
echo ================================================
echo.

REM Проверка, что Docker контейнеры запущены
docker ps | findstr medwork-backend >nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Docker контейнеры не запущены!
    echo.
    echo Запустите контейнеры командой:
    echo   docker-compose up -d
    echo.
    pause
    exit /b 1
)

echo [1/2] Проверка Docker контейнеров...
echo   ✓ Backend запущен
echo.

echo [2/2] Запуск скрипта заполнения...
echo.

node seed-database.js

echo.
echo ================================================
echo.

if %errorlevel% equ 0 (
    echo ✅ База данных успешно заполнена!
    echo.
    echo Теперь можно войти в систему:
    echo   http://localhost:5173
    echo.
) else (
    echo ❌ Произошла ошибка при заполнении
    echo.
)

pause

