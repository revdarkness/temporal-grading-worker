# PowerShell script to create desktop shortcut for grader.bat
# Run this script to add a "Grading Workflow" shortcut to your desktop

$WScriptShell = New-Object -ComObject WScript.Shell
$Desktop = [System.Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop "Grading Workflow.lnk"

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetPath = Join-Path $ScriptDir "grader.bat"

# Create the shortcut
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = $ScriptDir
$Shortcut.Description = "Start the AI Grading Workflow System"
$Shortcut.IconLocation = "C:\Windows\System32\shell32.dll,70"  # Document icon
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now double-click 'Grading Workflow' on your desktop to start the system." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit"
