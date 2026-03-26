@echo off
title SPIRIT-WIKI-ROUTER v5.2 CORE
cls

echo ==========================================================
echo   SPIRIT WIKI-ROUTER v5.2 - MOBILE APP SHELL ENGINE
echo ==========================================================
echo.
echo [1/2] Checking Node.js Environment...
cd /d "C:\Users\55341\Desktop\spirit"

echo [2/2] Starting Node.js Server (server.js)...
echo.
echo ----------------------------------------------------------
echo  >> Local Access: http://localhost:3000
echo  >> Mobile Access: Check your LocalTunnel or IP address
echo ----------------------------------------------------------
echo.

:: 서버 실행
node server.js

pause