@echo off
echo ==========================================
echo   Toolzz Chat - Inicializador Seguro v1.0
echo ==========================================

echo [1/4] Matando processos node.exe antigos...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] Iniciando API (Backend) na porta 3000...
start "Toolzz API" cmd /c "npx nx serve api"

echo Aguardando API subir (15 segundos)...
timeout /t 15 /nobreak

echo [3/4] Iniciando WEB (Frontend) na porta 3001...
start "Toolzz WEB" cmd /c "npx nx serve web"

echo.
echo [4/4] Tudo pronto!
echo - API: http://localhost:3000
echo - WEB: http://localhost:3001
echo.
echo Pressione qualquer tecla para sair deste console (os servidores continuarao rodando)...
pause >nul
