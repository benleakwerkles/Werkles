[CmdletBinding()]
param(
    [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'
$ruleName = "Harvey LAN Preview (TCP $Port)"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

if ($existing) {
    $existing | Set-NetFirewallRule -Enabled True -Direction Inbound -Action Allow -Profile Public,Private
    Get-NetFirewallAddressFilter -AssociatedNetFirewallRule $existing |
        Set-NetFirewallAddressFilter -RemoteAddress LocalSubnet
    Get-NetFirewallPortFilter -AssociatedNetFirewallRule $existing |
        Set-NetFirewallPortFilter -Protocol TCP -LocalPort $Port
}
else {
    New-NetFirewallRule `
        -DisplayName $ruleName `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort $Port `
        -Profile Public,Private `
        -RemoteAddress LocalSubnet | Out-Null
}

$rule = Get-NetFirewallRule -DisplayName $ruleName
$address = Get-NetFirewallAddressFilter -AssociatedNetFirewallRule $rule
$portFilter = Get-NetFirewallPortFilter -AssociatedNetFirewallRule $rule

[pscustomobject]@{
    status = 'HARVEY_LAN_FIREWALL_READY'
    display_name = $rule.DisplayName
    enabled = $rule.Enabled
    profile = $rule.Profile
    direction = $rule.Direction
    action = $rule.Action
    protocol = $portFilter.Protocol
    local_port = $portFilter.LocalPort
    remote_address = $address.RemoteAddress
}
