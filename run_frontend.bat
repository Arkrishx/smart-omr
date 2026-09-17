@echo off
echo Starting Smart OMR Vite Frontend on port 5173...
cd /d "%~dp0frontend"
call "%~dp0..\tools\run_node.cmd" npm run dev
