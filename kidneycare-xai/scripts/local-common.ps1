$ErrorActionPreference = 'Stop'
$Project = Split-Path -Parent $PSScriptRoot
$LocalEnvFile = Join-Path $Project '.env.development.local'
$Runtime = Join-Path $Project 'logs/local'
$StateFile = Join-Path $Runtime 'native.json'
$VenvDirectory = if ($env:KIDNEYCARE_VENV) { [IO.Path]::GetFullPath($env:KIDNEYCARE_VENV) } else { Join-Path $Project 'ml-service/.venv' }
$ComposeFile = Join-Path $Project 'docker-compose.yml'
$Defaults = @{
    DB_NAME = 'kidneycare'
    DB_USERNAME = 'kidneycare'
    DB_PORT = '55432'
    FRONTEND_PORT = '3000'
    SERVER_PORT = '8080'
    ML_PORT = '8000'
    ASSISTANT_PROVIDER = 'mock'
    ASSISTANT_MODEL = ''
    GEMINI_API_KEY = ''
    ASSISTANT_RETRIEVER = 'fixture'
    ASSISTANT_KB_DSN = ''
    ASSISTANT_EMBEDDING_MODEL = ''
    ASSISTANT_SYNTHETIC_RESEARCH = ''
    ASSISTANT_CONVERSATIONAL_RESEARCH = ''
    ASSISTANT_SYNTHETIC_ACCOUNTS = ''
}

function Initialize-DevelopmentEnvironment {
    if (-not (Test-Path -LiteralPath $LocalEnvFile)) {
        $password = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
        $lines = @('# Local development only. Keep the existing database password when adopting an older Compose volume.')
        $lines += 'DB_PASSWORD=' + $password
        $lines += $Defaults.Keys | Sort-Object | ForEach-Object { "$_=$($Defaults[$_])" }
        $stream = [IO.File]::Open($LocalEnvFile, 'CreateNew', 'Write', 'None')
        try {
            $newline = [Environment]::NewLine
            $bytes = [Text.Encoding]::UTF8.GetBytes(($lines -join $newline) + $newline)
            $stream.Write($bytes, 0, $bytes.Length)
        } finally {
            $stream.Dispose()
        }
    }
    & (Join-Path $PSScriptRoot 'Initialize-LocalAuth.ps1')
}

function Import-DevelopmentEnvironment {
    if (-not (Test-Path -LiteralPath $LocalEnvFile)) { throw 'Run scripts/setup-local.ps1 first.' }
    $settings = $Defaults.Clone()
    foreach ($line in [IO.File]::ReadAllLines($LocalEnvFile)) {
        if ($line -match '^\s*(#|$)') { continue }
        if ($line -notmatch '^([A-Z][A-Z_0-9]*)=(.*)$') { throw 'Use plain KEY=value lines in .env.development.local.' }
        $settings[$Matches[1]] = $Matches[2]
    }
    foreach ($name in 'DB_NAME', 'DB_USERNAME') {
        if ($settings[$name] -notmatch '^[a-z][a-z0-9_]{0,62}$') { throw "Invalid local $name." }
    }
    foreach ($name in 'DB_PORT', 'FRONTEND_PORT', 'SERVER_PORT', 'ML_PORT') {
        if ($settings[$name] -notmatch '^\d{1,5}$' -or [int]$settings[$name] -lt 1024 -or [int]$settings[$name] -gt 65535) {
            throw "Invalid local $name."
        }
    }
    if (-not $settings.DB_PASSWORD) { throw 'A local DB_PASSWORD is required.' }
    if ($settings.ASSISTANT_PROVIDER -notin @('mock', 'gemini')) { throw 'Invalid local ASSISTANT_PROVIDER.' }
    if ($settings.ASSISTANT_PROVIDER -eq 'gemini' -and (-not $settings.GEMINI_API_KEY -or -not $settings.ASSISTANT_MODEL)) {
        throw 'Gemini requires both GEMINI_API_KEY and ASSISTANT_MODEL.'
    }
    if ($settings.ASSISTANT_RETRIEVER -notin @('fixture', 'pgvector')) { throw 'Invalid local ASSISTANT_RETRIEVER.' }
    if ($settings.ASSISTANT_RETRIEVER -eq 'pgvector' -and -not $settings.ASSISTANT_EMBEDDING_MODEL) {
        throw 'pgvector requires ASSISTANT_EMBEDDING_MODEL.'
    }
    foreach ($name in ($Defaults.Keys + @('DB_PASSWORD'))) {
        [Environment]::SetEnvironmentVariable($name, $settings[$name], 'Process')
    }
    & (Join-Path $PSScriptRoot 'Initialize-LocalAuth.ps1')
    return $settings
}

function Get-Docker {
    $docker = (Get-Command docker.exe -ErrorAction SilentlyContinue | Select-Object -First 1).Source
    if (-not $docker) {
        $docker = Join-Path $env:LOCALAPPDATA 'Programs/DockerDesktop/resources/bin/docker.exe'
        if (-not (Test-Path -LiteralPath $docker)) { return }
    }
    $dockerBin = Split-Path -Parent $docker
    if (($env:PATH -split ';' ) -notcontains $dockerBin) { $env:PATH = "$dockerBin;$env:PATH" }
    $context = & $docker context show 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $context) { return }
    $endpoint = & $docker context inspect $context --format '{{.Endpoints.docker.Host}}' 2>$null
    if ($LASTEXITCODE -ne 0 -or $endpoint -notmatch '^npipe:/{4}\./pipe/[^/]+$' -or $env:DOCKER_HOST) { return }
    $platform = & $docker --context $context info --format '{{.OSType}}' 2>$null
    if ($LASTEXITCODE -eq 0 -and $platform -eq 'linux') {
        return @{ Path = $docker; Context = $context }
    }
}

function Invoke-LocalCompose {
    param([string[]]$Arguments)
    if (-not $Docker) { throw 'A local Docker Desktop Linux engine is unavailable.' }
    if ($Settings.ASSISTANT_RETRIEVER -eq 'pgvector') {
        $dsn = $null
        if (-not [uri]::TryCreate($Settings.ASSISTANT_KB_DSN, [UriKind]::Absolute, [ref]$dsn) -or
            $dsn.Scheme -notin @('postgres', 'postgresql') -or $dsn.Host -ne 'db' -or
            $dsn.Port -notin @(5432, -1) -or $dsn.AbsolutePath -ne "/$($Settings.DB_NAME)" -or $dsn.Query) {
            throw 'Docker pgvector requires a PostgreSQL URI pointing to the Compose db service and configured DB_NAME.'
        }
    }
    if ($Arguments[0] -in @('up', 'down')) {
        $owners = & $Docker.Path --context $Docker.Context ps -a --filter 'label=com.docker.compose.project=kidneycare-xai' --format '{{.Label "com.docker.compose.project.working_dir"}}'
        if ($LASTEXITCODE -ne 0) { throw 'Could not determine the checkout owning the Compose project.' }
        foreach ($owner in $owners) {
            if (-not $owner -or [IO.Path]::GetFullPath($owner) -ne [IO.Path]::GetFullPath($Project)) {
                throw 'An existing kidneycare-xai Compose project belongs to a different checkout.'
            }
        }
    }
    & $Docker.Path --context $Docker.Context compose --env-file $LocalEnvFile -p kidneycare-xai -f $ComposeFile @Arguments
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose failed. Review the command output and service logs.' }
}

function Resolve-LocalMode {
    param([string]$Mode)
    if ($Mode -ne 'Auto') { return $Mode }
    if ((Test-Path -LiteralPath $StateFile) -or (Test-Path (Join-Path $Runtime 'postgres/postmaster.pid'))) { return 'Native' }
    if ($Docker) { return 'Docker' }
    return 'Native'
}

function Get-NativeTools {
    $javaCandidates = @()
    if ($env:JAVA_HOME) { $javaCandidates += (Join-Path $env:JAVA_HOME 'bin/java.exe') }
    $javaCandidates += (Get-Command java.exe -ErrorAction SilentlyContinue | Select-Object -First 1).Source
    foreach ($directory in @("$env:ProgramFiles/Eclipse Adoptium", "$env:ProgramFiles/Java", "$env:ProgramFiles/Microsoft")) {
        $javaCandidates += Get-ChildItem -LiteralPath $directory -Directory -ErrorAction SilentlyContinue |
            ForEach-Object { Join-Path $_.FullName 'bin/java.exe' }
    }
    foreach ($candidate in $javaCandidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate) -and ((& $candidate -version 2>&1) -match 'version "17\.')) {
            $java = $candidate
            break
        }
    }
    if (-not $java) { throw 'Install a JDK 17 or set JAVA_HOME to its installation directory.' }
    $env:JAVA_HOME = Split-Path -Parent (Split-Path -Parent $java)
    if (-not (Test-Path (Join-Path $env:JAVA_HOME 'bin/javac.exe'))) { throw 'JAVA_HOME must point to JDK 17.' }
    $maven = (Get-Command mvn.cmd -ErrorAction SilentlyContinue).Source
    if (-not $maven) { throw 'Install Maven 3.9 and add it to PATH.' }

    $node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
    $npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
    if (-not $node -or -not $npm) { throw 'Install Node.js 24 LTS and add it to PATH.' }
    $nodeVersion = [version]((& $node --version).TrimStart('v'))
    if ($nodeVersion -lt [version]'20.19.0' -or ($nodeVersion.Major -eq 22 -and $nodeVersion.Minor -lt 12) -or
        $nodeVersion.Major -eq 21) { throw 'Use Node.js 20.19+, 22.12+, or the recommended 24 LTS.' }

    $psql = (Get-Command psql.exe -ErrorAction SilentlyContinue).Source
    $pgCtl = (Get-Command pg_ctl.exe -ErrorAction SilentlyContinue).Source
    $initDb = (Get-Command initdb.exe -ErrorAction SilentlyContinue).Source
    if (-not $psql -or -not $pgCtl -or -not $initDb) {
        throw 'Install PostgreSQL 15 and add its bin directory with psql, pg_ctl, and initdb to PATH.'
    }
    return @{ Java = $java; Maven = $maven; Node = $node; Npm = $npm; Psql = $psql; PgCtl = $pgCtl; InitDb = $initDb }
}

function Initialize-NativeDependencies {
    $mlDirectory = Join-Path $Project 'ml-service'
    $venv = Join-Path $VenvDirectory 'Scripts/python.exe'
    if (-not (Test-Path -LiteralPath $venv)) {
        $base = $env:KIDNEYCARE_PYTHON
        $launcher = @()
        if (-not $base) {
            $base = (Get-Command py.exe -ErrorAction SilentlyContinue).Source
            $launcher = @('-3.11')
        }
        if (-not $base) { throw 'Install Python 3.11 or set KIDNEYCARE_PYTHON to its executable.' }
        & $base @launcher -c 'import sys; raise SystemExit(sys.version_info[:2] != (3,11))'
        if ($LASTEXITCODE -ne 0) { throw 'A working Python 3.11 installation is required.' }
        & $base @launcher -m venv $VenvDirectory
        if ($LASTEXITCODE -ne 0) { throw 'Could not create the Python virtual environment.' }
    }
    & $venv -c 'import sys; raise SystemExit(sys.version_info[:2] != (3,11))'
    if ($LASTEXITCODE -ne 0) { throw 'The existing ML .venv must use Python 3.11.' }
    & $venv -m pip install -r (Join-Path $mlDirectory 'requirements.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Python dependency installation failed.' }
    Push-Location (Join-Path $Project 'frontend')
    try {
        & $Native.Npm ci
        if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' }
    } finally {
        Pop-Location
    }
}

function Wait-LocalHealth {
    param([string]$Url, [scriptblock]$Accept = { $true }, [Diagnostics.Process]$Process)
    for ($attempt = 0; $attempt -lt 90; $attempt++) {
        if ($Process -and $Process.HasExited) { throw "Local service exited before becoming healthy at $Url. See logs/local." }
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 3 -MaximumRedirection 0
            if ($response.StatusCode -eq 200 -and (& $Accept $response)) { return }
        } catch {
            # The service can be starting or rebuilding.
        }
        Start-Sleep -Seconds 1
    }
    throw "Health check did not succeed at $Url. See logs/local or Docker Compose logs."
}

function Assert-LocalPortFree {
    param([int]$Port)
    $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
    $listener.ExclusiveAddressUse = $true
    try { $listener.Start() } catch { throw "Loopback port $Port is in use. Choose another port in .env.development.local." }
    finally { $listener.Stop() }
}

function Stop-NativeApplications {
    if (-not (Test-Path -LiteralPath $StateFile)) { return }
    $entries = Get-Content -LiteralPath $StateFile -Raw | ConvertFrom-Json
    foreach ($entry in $entries) {
        $process = Get-Process -Id $entry.Id -ErrorAction SilentlyContinue
        if ($process -and $process.StartTime.ToUniversalTime().Ticks.ToString() -eq $entry.StartTicks) {
            & taskkill.exe /PID $entry.Id /T /F | Out-Null
            if ($LASTEXITCODE -ne 0 -and (Get-Process -Id $entry.Id -ErrorAction SilentlyContinue)) {
                throw "Could not stop the recorded $($entry.Name) process."
            }
        }
    }
    Remove-Item -LiteralPath $StateFile
}

function Start-NativeApplication {
    param([string]$Name, [string]$Executable, [string]$Directory, [string[]]$Arguments)
    $launch = @{
        FilePath = $Executable
        ArgumentList = $Arguments
        WorkingDirectory = $Directory
        WindowStyle = 'Hidden'
        RedirectStandardOutput = Join-Path $Runtime "$Name.out.log"
        RedirectStandardError = Join-Path $Runtime "$Name.err.log"
        PassThru = $true
    }
    $process = Start-Process @launch
    $entries = @()
    if (Test-Path -LiteralPath $StateFile) {
        $entries += Get-Content -LiteralPath $StateFile -Raw | ConvertFrom-Json
    }
    $entries += @{ Id = $process.Id; StartTicks = $process.StartTime.ToUniversalTime().Ticks.ToString(); Name = $Name }
    $entries | ConvertTo-Json -AsArray | Set-Content -LiteralPath $StateFile -Encoding utf8NoBOM
    return $process
}

function Invoke-NativeSql {
    param([string]$Database, [string[]]$Arguments)
    $env:PGPASSWORD = $Settings.DB_PASSWORD
    $env:PGCONNECT_TIMEOUT = '5'
    & $Native.Psql -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p $Settings.DB_PORT -U $Settings.DB_USERNAME -d $Database @Arguments
    if ($LASTEXITCODE -ne 0) { throw 'A local PostgreSQL command failed. Review its error output.' }
}

function Start-NativeDatabase {
    $cluster = Join-Path $Runtime 'postgres'
    if (-not (Test-Path (Join-Path $cluster 'PG_VERSION'))) {
        Assert-LocalPortFree $Settings.DB_PORT
        $passwordFile = Join-Path $Runtime "postgres-$([guid]::NewGuid()).local"
        try {
            Set-Content -LiteralPath $passwordFile -Encoding utf8NoBOM -Value $Settings.DB_PASSWORD
            & $Native.InitDb -D $cluster -U $Settings.DB_USERNAME --auth=scram-sha-256 --encoding=UTF8 --no-locale --pwfile=$passwordFile
            if ($LASTEXITCODE -ne 0) { throw 'Local PostgreSQL initialization failed.' }
        } finally {
            Remove-Item -LiteralPath $passwordFile -ErrorAction SilentlyContinue
        }
    }
    & $Native.PgCtl status -D $cluster | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Assert-LocalPortFree $Settings.DB_PORT
        & $Native.PgCtl start -D $cluster -w -l (Join-Path $Runtime 'postgres.log') -o "-h 127.0.0.1 -p $($Settings.DB_PORT)"
        if ($LASTEXITCODE -ne 0) { throw 'Local PostgreSQL startup failed. See logs/local/postgres.log.' }
    }
    # Confirm that the live instance belongs to this checkout before writing.
    $directory = Invoke-NativeSql postgres @('-Atq', '-c', 'SHOW data_directory')
    if ([IO.Path]::GetFullPath($directory) -ne [IO.Path]::GetFullPath($cluster)) {
        throw 'The configured port is serving a different PostgreSQL cluster.'
    }
    $exists = Invoke-NativeSql postgres @('-Atq', '-c', "SELECT 1 FROM pg_database WHERE datname = '$($Settings.DB_NAME)'")
    if ($exists -ne '1') {
        Invoke-NativeSql postgres @('-q', '-c', ('CREATE DATABASE "' + $Settings.DB_NAME + '"'))
    }
    Push-Location (Join-Path $Project 'docs/database')
    try {
        $vector = ($Settings.ASSISTANT_RETRIEVER -eq 'pgvector').ToString().ToLowerInvariant()
        Invoke-NativeSql $Settings.DB_NAME @('-q', '-v', "enable_vector=$vector", '--single-transaction', '-f', (Join-Path $PSScriptRoot 'migrate-local.sql'))
    } finally {
        Pop-Location
    }
}

function Stop-NativeDatabase {
    $cluster = Join-Path $Runtime 'postgres'
    if (-not (Test-Path (Join-Path $cluster 'postmaster.pid'))) { return }
    $pgCtl = (Get-Command pg_ctl.exe -ErrorAction SilentlyContinue).Source
    if (-not $pgCtl) { throw 'Add the local PostgreSQL bin directory to PATH to stop the database.' }
    & $pgCtl stop -D $cluster -m fast -w
    if ($LASTEXITCODE -ne 0) { throw 'The checkout PostgreSQL cluster could not be stopped.' }
}

function Set-NativeApplicationEnvironment {
    $env:DB_URL = "jdbc:postgresql://127.0.0.1:$($Settings.DB_PORT)/$($Settings.DB_NAME)"
    $env:SPRING_DATASOURCE_URL = $env:DB_URL
    $env:SPRING_DATASOURCE_USERNAME = $Settings.DB_USERNAME
    $env:SPRING_DATASOURCE_PASSWORD = $Settings.DB_PASSWORD
    $env:SPRING_JPA_HIBERNATE_DDL_AUTO = 'none'
    $env:HIBERNATE_DDL_AUTO = 'none'
    $env:SPRING_APPLICATION_JSON = ''
    $env:PORT = $Settings.SERVER_PORT
    $env:SERVER_ADDRESS = '127.0.0.1'
    $env:ML_SERVICE_URL = "http://127.0.0.1:$($Settings.ML_PORT)"
    $env:MODEL_PATH = Join-Path $Project 'ml-service/models'
    $env:LOCAL_API_PROXY_TARGET = "http://127.0.0.1:$($Settings.SERVER_PORT)"
    $env:VITE_API_URL = '/api'
    $env:VITE_API_BASE_URL = '/api'
    $env:PYTHONPATH = ''
    $env:VIRTUAL_ENV = $VenvDirectory
    if ($Settings.ASSISTANT_RETRIEVER -eq 'pgvector') {
        if ($Settings.ASSISTANT_KB_DSN) { throw 'Leave ASSISTANT_KB_DSN empty in Native mode. The script uses the local cluster.' }
        $user = $Settings.DB_USERNAME
        $password = [uri]::EscapeDataString($Settings.DB_PASSWORD)
        $env:ASSISTANT_KB_DSN = "postgresql://${user}:${password}@127.0.0.1:$($Settings.DB_PORT)/$($Settings.DB_NAME)"
    }
}

function Check-Frontend {
    param([string]$Url)
    Wait-LocalHealth $Url
    Wait-LocalHealth "$Url/api/assessments/model-evaluation" {
        param($response)
        $evaluation = $response.Content | ConvertFrom-Json
        $evaluation.modelVersion -and $evaluation.status -in @('available', 'metrics_unavailable')
    }
    Wait-LocalHealth "$Url/api/research/analytics" {
        param($response)
        ($response.Content | ConvertFrom-Json).PSObject.Properties.Name -contains 'totalResponses'
    }
}
