@echo off
echo Removendo token antigo...
set CLOUDFLARE_API_TOKEN=
echo.
echo Fazendo login via OAuth...
npx wrangler login
echo.
echo Fazendo deploy...
npx wrangler deploy
pause
