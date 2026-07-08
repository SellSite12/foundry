$ErrorActionPreference = "Stop"
$root = $PSScriptRoot | Split-Path -Parent
$staging = Join-Path $env:TEMP "foundry-staging-$(Get-Random)"
$zip = Join-Path $env:TEMP "foundry-deploy-$(Get-Random).zip"

New-Item -ItemType Directory -Path $staging -Force | Out-Null
robocopy $root $staging /MIR /XD node_modules .next .netlify .git var coverage /XF .env netlify-env.import /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $zip -CompressionLevel Optimal
Remove-Item -Recurse -Force $staging
Write-Output $zip
