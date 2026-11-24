# Create local-only secrets once, then import them into this process.
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$secretFile = Join-Path $project '.env.auth.local'
if (-not (Test-Path -LiteralPath $secretFile)) {
    $jwt = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
    $internal = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    $stream = $null
    try {
        $stream = [IO.File]::Open($secretFile, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
        $bytes = [Text.Encoding]::ASCII.GetBytes("JWT_SECRET=$jwt`nML_INTERNAL_SECRET=$internal`n")
        $stream.Write($bytes, 0, $bytes.Length)
    } catch [IO.IOException] {
        if ($null -ne $stream -or -not (Test-Path -LiteralPath $secretFile)) { throw }
    } finally {
        if ($null -ne $stream) { $stream.Dispose() }
    }
}
$values = @{}
foreach ($line in [IO.File]::ReadAllLines($secretFile)) {
    if ($line -match '^(JWT_SECRET|ML_INTERNAL_SECRET)=([A-Za-z0-9+/=]{43,})$') {
        $values[$Matches[1]] = $Matches[2]
    }
}
if (-not $values['JWT_SECRET'] -or -not $values['ML_INTERNAL_SECRET']) {
    throw 'The local auth file is incomplete. Restore it or explicitly rotate the local keys.'
}
$env:JWT_SECRET = $values['JWT_SECRET']
$env:ML_INTERNAL_SECRET = $values['ML_INTERNAL_SECRET']
