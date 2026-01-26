# PowerShell script to move Skyymarkai folder from Desktop to C:\Projects and block OneDrive sync for the new location

$source = "$env:USERPROFILE\Desktop\Skyymarkai"
$destinationRoot = "C:\Projects"
$destination = "$destinationRoot\Skyymarkai"

# Create destination directory if it doesn't exist
if (!(Test-Path -Path $destinationRoot)) {
    New-Item -ItemType Directory -Path $destinationRoot | Out-Null
}

# Move the folder
if (Test-Path -Path $source) {
    Move-Item -Path $source -Destination $destination
    Write-Host "Moved Skyymarkai to $destination."
} else {
    Write-Host "Source folder not found: $source"
}

# Block OneDrive from syncing the new location by creating a .nosync file
$nosyncFile = "$destination\.nosync"
New-Item -ItemType File -Path $nosyncFile -Force | Out-Null
Write-Host "Created .nosync file to help block OneDrive sync in $destination."

Write-Host "Operation complete."
