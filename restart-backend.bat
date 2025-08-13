@echo off
echo Restarting MonkeyZ Backend with CSRF Fix
echo ========================================
echo.

echo Stopping any existing backend processes...
taskkill /f /im python.exe 2>nul
timeout /t 2 /nobreak > nul

echo Starting backend server with updated security settings...
cd backend
start "MonkeyZ Backend" cmd /k "echo Backend Server Starting... && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo.
echo ✅ Backend restarted with CSRF fix!
echo 🌐 Backend: http://localhost:8000
echo 📖 API Docs: http://localhost:8000/docs
echo.
echo CSRF Protection Changes:
echo - Admin endpoints now excluded from CSRF in development mode
echo - JWT token lookup fixed in frontend
echo - Added debug logging for authentication
echo.
echo Test Instructions:
echo 1. Login to admin panel as admin user
echo 2. Try deleting a product
echo 3. Check browser console for auth debug messages
echo 4. Should work without 403 Forbidden error
echo.
pause
