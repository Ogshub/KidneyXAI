#Requires -Version 7.2
param([ValidateSet('Auto', 'Docker', 'Native')][string]$Mode = 'Auto')
. "$PSScriptRoot/local-common.ps1"
$Docker = if ($Mode -ne 'Native') { Get-Docker }
$Mode = Resolve-LocalMode $Mode
if ($Mode -eq 'Docker') {
    $Settings = Import-DevelopmentEnvironment
    Invoke-LocalCompose @('down')
} elseif (Test-Path $Runtime) {
    $lock = [IO.File]::Open((Join-Path $Runtime 'native.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
    try {
        try { Stop-NativeApplications } finally { Stop-NativeDatabase }
    } finally {
        $lock.Dispose()
    }
}
Write-Host "Local $Mode services stopped. Database files were preserved."
