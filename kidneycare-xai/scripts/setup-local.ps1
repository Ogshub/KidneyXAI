#Requires -Version 7.2
param([ValidateSet('Auto', 'Docker', 'Native')][string]$Mode = 'Auto')
. "$PSScriptRoot/local-common.ps1"
$Docker = if ($Mode -ne 'Native') { Get-Docker }
$Mode = Resolve-LocalMode $Mode
Initialize-DevelopmentEnvironment
$Settings = Import-DevelopmentEnvironment
if ($Mode -eq 'Docker') {
    Invoke-LocalCompose @('config', '--quiet')
} else {
    $Native = Get-NativeTools
    Initialize-NativeDependencies
}
Write-Host "Local configuration validated for $Mode."
