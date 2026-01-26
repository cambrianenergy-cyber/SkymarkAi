# PowerShell script to clean up invisible/control characters in all .ts, .tsx, and .js files in the workspace
# This will remove non-printable ASCII except for newlines, tabs, and carriage returns
# Usage: Run in the root of your project

Get-ChildItem -Path . -Include *.ts,*.tsx,*.js -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    # Remove all non-printable ASCII except tab (9), LF (10), CR (13)
    $clean = -join ($content.ToCharArray() | Where-Object { ($_ -ge 32 -and $_ -le 126) -or $_ -eq 9 -or $_ -eq 10 -or $_ -eq 13 })
    if ($content -ne $clean) {
        Set-Content $_.FullName $clean
        Write-Host "Cleaned: $($_.FullName)"
    }
}
Write-Host "Invisible/control character cleanup complete."
