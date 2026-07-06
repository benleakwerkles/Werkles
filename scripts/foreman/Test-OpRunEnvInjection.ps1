#requires -Version 5.1
$ErrorActionPreference = "Stop"
$names = @("STRIPE_SECRET_KEY", "PLAID_CLIENT_ID", "PLAID_SECRET", "PLAID_ENV")
$rows = foreach ($name in $names) {
  $value = [Environment]::GetEnvironmentVariable($name, "Process")
  [ordered]@{
    name = $name
    present = -not [string]::IsNullOrWhiteSpace($value)
    length = if ($value) { $value.Length } else { 0 }
  }
}
@{
  status = "OP_RUN_ENV_SMOKE"
  secret_values_printed = "NO"
  fields = $rows
} | ConvertTo-Json -Depth 4
