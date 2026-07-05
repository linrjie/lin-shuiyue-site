$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputPath = Join-Path $projectRoot 'lin-shuiyue-site.zip'
$siteFiles = @(
  'index.html',
  'styles.css',
  'script.js',
  'favicon.svg'
) | ForEach-Object { Join-Path $projectRoot $_ }

$missingFiles = $siteFiles | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) }
if ($missingFiles) {
  throw "缺少网站文件：$($missingFiles -join ', ')"
}

if (Test-Path -LiteralPath $outputPath) {
  Remove-Item -LiteralPath $outputPath -Force
}

Compress-Archive -LiteralPath $siteFiles -DestinationPath $outputPath -CompressionLevel Optimal
Write-Output "已生成：$outputPath"
