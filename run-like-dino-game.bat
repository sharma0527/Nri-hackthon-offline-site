@echo off
title ASTRA - Direct Offline Player (Like Chrome Dino)
cd /d "%~dp0"

echo Opening ASTRA directly offline...
start "" "%~dp0dist\offline.html"
exit
