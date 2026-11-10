@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto no_node

node release\index.mjs %*
set EXITCODE=%ERRORLEVEL%
if not "%EXITCODE%"=="0" goto failed
exit /b 0

:no_node
echo.
echo [ERROR] Node.js 22+ was not found in PATH.
echo Install Node.js from https://nodejs.org/ and try again.
echo.
pause
exit /b 1

:failed
echo.
echo Release console exited with code %EXITCODE%.
pause
exit /b %EXITCODE%
