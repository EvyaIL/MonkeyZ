@echo off
echo Cleaning up invalid orderId values in database...
cd /d "%~dp0.."
python scripts/cleanup_invalid_order_ids.py
pause
