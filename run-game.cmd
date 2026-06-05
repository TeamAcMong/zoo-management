@echo off
REM Double-click launcher for Animal World Zoo.
REM Starts the local server (run-game.ps1) and opens the game in your browser.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-game.ps1" %*
pause
