$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputPath = Join-Path $projectRoot 'lin-shuiyue-site.zip'
$distPath = Join-Path $projectRoot 'dist'

Push-Location $projectRoot
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Astro build failed.' }
} finally {
  Pop-Location
}

if (-not (Test-Path -LiteralPath $distPath)) {
  throw "Missing build directory: $distPath"
}

if (Test-Path -LiteralPath $outputPath) {
  Remove-Item -LiteralPath $outputPath -Force
}

Compress-Archive -Path (Join-Path $distPath '*') -DestinationPath $outputPath -CompressionLevel Optimal
Write-Output "Created: $outputPath"
