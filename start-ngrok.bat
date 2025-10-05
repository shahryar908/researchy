@echo off
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  🚀 Researchy Full Stack Ngrok Deployment                 ║
echo ║  Frontend (Next.js) + Backend (Bun) + Agent (uv Python)   ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Start ngrok tunnels (3 tunnels: frontend, backend, agent)
echo [1/4] 🌐 Starting ngrok tunnels (frontend, backend, agent)...
start "Ngrok Tunnels" ngrok.cmd start --all --config ngrok.yml
timeout /t 5 /nobreak >nul

REM Start Bun Backend
echo [2/4] 📦 Starting Bun backend (port 3001)...
start "Backend (Bun)" cmd /k "cd backend && bun run dev"
timeout /t 3 /nobreak >nul

REM Start Python Agent with uv
echo [3/4] 🤖 Starting Python agent with uv (port 8000)...
start "Agent (uv)" cmd /k "cd agent\ai-researcher && uv run main.py"
timeout /t 3 /nobreak >nul

REM Start Next.js Frontend
echo [4/4] 🎨 Starting Next.js frontend (port 3000)...
start "Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ All services started successfully!
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📊 Ngrok Dashboard: http://localhost:4040
echo    View all 3 active tunnels and incoming requests
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📋 Next Steps:
echo.
echo   1. Wait 15-20 seconds for all services to initialize
echo   2. Run: node get-ngrok-urls.js (to get public URLs)
echo   3. Copy frontend ngrok URL - this is your public app URL!
echo   4. Update frontend .env.local with backend ngrok URL
echo   5. Update agent .env with backend ngrok URL
echo   6. Restart frontend and agent windows
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 🌐 Your entire app is now publicly accessible via ngrok!
echo    Share the frontend ngrok URL to showcase your project.
echo.
echo 💡 Tip: Run 'node get-ngrok-urls.js' to see all public URLs
echo.
pause
