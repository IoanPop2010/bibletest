@echo off
title Upload proiect GitHub
cd /d "%~dp0"

echo.
echo ========================================
echo       UPLOAD PROIECT GITHUB
echo ========================================
echo.

set /p mesaj="Cum se numeste modificarea? "

if "%mesaj%"=="" (
    echo Trebuie sa introduci un nume pentru modificare.
    pause
    exit /b
)

echo.
echo [1/3] Adaug toate modificarile...
git add .

echo.
echo [2/3] Creez commit...
git commit -m "%mesaj%"

echo.
echo [3/3] Urc pe GitHub...
git push

echo.
echo ========================================
echo          UPLOAD FINALIZAT
echo ========================================
pause