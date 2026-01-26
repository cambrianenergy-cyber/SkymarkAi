# PowerShell script to unlink Desktop from OneDrive

# Get current user's OneDrive path
$oneDrivePath = "$env:OneDrive"
$desktopPath = "$env:USERPROFILE\Desktop"
$oneDriveDesktop = "$oneDrivePath\Desktop"

# Check if Desktop is being synced by OneDrive
if (Test-Path -Path $oneDriveDesktop) {
    # Move files from OneDrive Desktop to local Desktop if needed
    Write-Host "Moving files from OneDrive Desktop to local Desktop..."
    Move-Item -Path "$oneDriveDesktop\*" -Destination $desktopPath -Force -ErrorAction SilentlyContinue
    
    # Remove OneDrive Desktop folder
    Remove-Item -Path $oneDriveDesktop -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Unlinked Desktop from OneDrive. Files moved to local Desktop."
} else {
    Write-Host "Desktop is not currently synced with OneDrive."
}

Write-Host "Operation complete."
