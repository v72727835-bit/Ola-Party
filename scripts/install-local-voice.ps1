$ErrorActionPreference = 'Stop'
$version = '1.13.10'
$installDir = Join-Path $env:LOCALAPPDATA 'PartyApp\livekit'
New-Item -ItemType Directory -Path $installDir -Force | Out-Null
$assetName = "livekit_${version}_windows_amd64.zip"
$baseUrl = "https://github.com/livekit/livekit/releases/download/v$version"
$zipPath = Join-Path $installDir $assetName
Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/$assetName" -OutFile $zipPath
$checksums = (Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/checksums.txt").Content
if ($checksums -is [byte[]]) { $checksums = [System.Text.Encoding]::UTF8.GetString($checksums) }
$expectedLine = ($checksums -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -match ([regex]::Escape($assetName) + '$') })
if (@($expectedLine).Count -ne 1) { throw 'Could not find unique official asset checksum.' }
$expected = ($expectedLine.Trim() -split '\s+')[0]
$actual = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
if ($actual -ne $expected) { throw 'LiveKit release checksum mismatch.' }
Expand-Archive -LiteralPath $zipPath -DestinationPath $installDir -Force
Write-Output "Verified LiveKit $version installed to $installDir"
Write-Output 'Start locally using npm run dev:voice. This uses development-only keys bound to loopback.'
