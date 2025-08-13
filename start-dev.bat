@echo off
echo Starting MonkeyZ Development Environment
echo =========================================
echo.

echo Checking if ports are available...
netstat -an | findstr :8000 > nul
if %errorlevel% equ 0 (
    echo Warning: Port 8000 is already in use. Backend might already be running.
) else (
    echo Port 8000 is available for backend.
)

netstat -an | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo Warning: Port 3000 is already in use. Frontend might already be running.
) else (
    echo Port 3000 is available for frontend.
)

echo.
echo Starting Backend Server...
start "MonkeyZ Backend" cmd /k "cd /d \"%~dp0backend\" && echo Starting backend server... && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "MonkeyZ Frontend" cmd /k "cd /d \"%~dp0frontend\" && echo Starting frontend server... && npm start"

echo.
echo ✅ Both servers are starting...
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8000
echo 📖 API Docs: http://localhost:8000/docs
echo.
echo To test password reset:
echo 1. Go to http://localhost:3000/sign-in
echo 2. Click "Forgot password?"
echo 3. Enter an email address
echo 4. Click "Send Reset Email"
echo 5. Check browser console for debug logs
echo.
echo Press any key to close this window...
pause > nul
