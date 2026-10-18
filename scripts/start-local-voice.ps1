$ErrorActionPreference = 'Stop'
$exe = Join-Path $env:LOCALAPPDATA 'PartyApp\livekit\livekit-server.exe'
if (-not (Test-Path -LiteralPath $exe)) {
    throw 'Local LiveKit missing. Run npm run setup:voice first.'
}
& $exe --dev --bind 127.0.0.1
exit $LASTEXITCODE
