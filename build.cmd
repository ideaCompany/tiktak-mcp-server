@echo off
set PROJECT=C:\Users\stefa\Repos\tiktak-mcp-server
cd /d "%PROJECT%"
.\node_modules\.bin\tsup.cmd %PROJECT%\src\index.ts --format esm --target node18 --clean --outDir %PROJECT%\dist --no-splitting
if %errorlevel% neq 0 exit /b %errorlevel%

node -e "const fs=require('fs');const f='%PROJECT%\\dist\\index.mjs';const c=fs.readFileSync(f,'utf8');fs.writeFileSync(f,'#!/usr/bin/env node\n'+c)"
echo Build complete.
