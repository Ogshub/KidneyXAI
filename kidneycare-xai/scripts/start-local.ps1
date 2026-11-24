#Requires -Version 7.2
param([ValidateSet('Auto', 'Docker', 'Native')][string]$Mode = 'Auto')
. "$PSScriptRoot/local-common.ps1"
$Docker = if ($Mode -ne 'Native') { Get-Docker }
$Mode = Resolve-LocalMode $Mode
$Settings = Import-DevelopmentEnvironment
$url = "http://127.0.0.1:$($Settings.FRONTEND_PORT)"
if ($Mode -eq 'Docker') {
    Invoke-LocalCompose @('up', '--build', '--detach', '--wait', '--wait-timeout', '240')
    Check-Frontend $url
    Write-Host "Frontend available at $url (Docker)."
    return
}

$Native = Get-NativeTools
$mlDirectory = Join-Path $Project 'ml-service'
$frontend = Join-Path $Project 'frontend'
$backend = Join-Path $Project 'backend-springboot'
$python = Join-Path $VenvDirectory 'Scripts/python.exe'
$vite = Join-Path $frontend 'node_modules/vite/bin/vite.js'
if (-not (Test-Path $python) -or -not (Test-Path $vite)) { throw 'Run scripts/setup-local.ps1 -Mode Native first.' }

New-Item -ItemType Directory -Path $Runtime -Force | Out-Null
# Serialize native start and stop operations for this checkout.
$lock = [IO.File]::Open((Join-Path $Runtime 'native.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
try {
    if (Test-Path $StateFile) { throw 'Native startup state exists. Run check-local.ps1 or stop-local.ps1 -Mode Native first.' }
    foreach ($port in @($Settings.DB_PORT, $Settings.ML_PORT, $Settings.SERVER_PORT, $Settings.FRONTEND_PORT)) {
        if ($port -ne $Settings.DB_PORT) { Assert-LocalPortFree $port }
    }
    if (@($Settings.DB_PORT, $Settings.ML_PORT, $Settings.SERVER_PORT, $Settings.FRONTEND_PORT | Select-Object -Unique).Count -ne 4) {
        throw 'Use distinct DB_PORT, ML_PORT, SERVER_PORT, and FRONTEND_PORT values in Native mode.'
    }
    Set-NativeApplicationEnvironment
    Push-Location $backend
    try {
        & $Native.Maven -B -DskipTests package
        if ($LASTEXITCODE -ne 0) { throw 'Backend packaging failed.' }
    } finally {
        Pop-Location
    }
    $jar = @(Get-ChildItem (Join-Path $backend 'target/*.jar'))
    if ($jar.Count -ne 1) { throw 'Expected exactly one packaged backend JAR in backend-springboot/target.' }

    try {
        Start-NativeDatabase
        # Relative launch arguments let Start-Process handle checkouts containing spaces.
        $mlProcess = Start-NativeApplication 'ml' $python $mlDirectory @('-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', $Settings.ML_PORT)
        Wait-LocalHealth "$env:ML_SERVICE_URL/health" { param($response) ($response.Content | ConvertFrom-Json).modelLoaded } -Process $mlProcess
        $backendProcess = Start-NativeApplication 'backend' $Native.Java $backend @('-jar', "target/$($jar[0].Name)")
        Wait-LocalHealth "$env:LOCAL_API_PROXY_TARGET/api/assessments/model-evaluation" -Process $backendProcess
        $null = Start-NativeApplication 'frontend' $Native.Node $frontend @('node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', $Settings.FRONTEND_PORT, '--strictPort')
        Check-Frontend $url
    } catch {
        $failure = $_
        try { Stop-NativeApplications } finally { Stop-NativeDatabase }
        throw $failure
    }
} finally {
    $lock.Dispose()
}
Write-Host "Frontend available at $url (Native)."
