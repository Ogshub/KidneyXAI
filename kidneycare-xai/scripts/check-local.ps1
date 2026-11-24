#Requires -Version 7.2
param([ValidateSet('Auto', 'Docker', 'Native')][string]$Mode = 'Auto')
. "$PSScriptRoot/local-common.ps1"
$Docker = if ($Mode -ne 'Native') { Get-Docker }
$Mode = Resolve-LocalMode $Mode
$Settings = Import-DevelopmentEnvironment
$url = "http://127.0.0.1:$($Settings.FRONTEND_PORT)"
if ($Mode -eq 'Docker') {
    Invoke-LocalCompose @('ps', '--all')
} else {
    $Native = Get-NativeTools
    $database = Invoke-NativeSql $Settings.DB_NAME @('-Atq', '-c', "SELECT to_regclass('public.ai_messages') IS NOT NULL")
    if ($database -ne 't') { throw 'Local database migrations are incomplete.' }
    $ml = "http://127.0.0.1:$($Settings.ML_PORT)"
    Wait-LocalHealth "$ml/health" { param($response) ($response.Content | ConvertFrom-Json).modelLoaded }
    $authorization = Invoke-WebRequest "$ml/evaluate" -SkipHttpErrorCheck -TimeoutSec 5
    if ($authorization.StatusCode -ne 403) { throw 'ML internal authentication check failed.' }
}
Check-Frontend $url
Write-Host "Frontend and proxied API passed at $url ($Mode)."
