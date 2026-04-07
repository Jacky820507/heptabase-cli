@echo off
pushd "%~dp0"
node bin/heptabase-sync.cjs sync-calendar --days 7
pause
