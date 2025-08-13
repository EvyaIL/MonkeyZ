@echo off
echo Starting MonkeyZ Development Environment
echo =========================================
echo.

echo Starting Backend Server...
start "MonkeyZ Backend" cmd /k "cd /d \"%~dp0backend\" && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "MonkeyZ Frontend" cmd /k "cd /d \"%~dp0frontend\" && npm start"

echo.
echo ✅ Both servers are starting...
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8000
echo 📖 API Docs: http://localhost:8000/docs
echo.
echo Press any key to close this window...
pause > nul
