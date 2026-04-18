# PowerShell script to fix DailySheets.jsx modal nesting

$filePath = "c:\Users\MEHEDI HASAN\Desktop\Smart Construction Management System\frontend\src\pages\DailySheets.jsx"

Write-Host "🔧 Fixing DailySheets.jsx modal nesting..." -ForegroundColor Cyan

# Read the file
$content = Get-Content $filePath -Raw

# Find and extract the viewSheet modal
$viewSheetModalStart = $content.IndexOf("{/* View Sheet Modal with Signature Workflow */}")
$viewSheetModalEnd = $content.IndexOf(")}`n                            </div>", $viewSheetModalStart) + ")}`n                            </div>".Length

if ($viewSheetModalStart -eq -1) {
    Write-Host "❌ Could not find viewSheet modal" -ForegroundColor Red
    exit
}

# Extract the modal
$viewSheetModal = $content.Substring($viewSheetModalStart, $viewSheetModalEnd - $viewSheetModalStart)

Write-Host "✅ Found viewSheet modal" -ForegroundColor Green

# Remove the modal from its current position
$contentWithoutModal = $content.Remove($viewSheetModalStart, $viewSheetModalEnd - $viewSheetModalStart)

# Find where to insert (before Sheets List)
$sheetsListIndex = $contentWithoutModal.IndexOf("{/* Sheets List */}")

if ($sheetsListIndex -eq -1) {
    Write-Host "❌ Could not find Sheets List" -ForegroundColor Red
    exit
}

# Insert the modal before Sheets List
$fixedContent = $contentWithoutModal.Insert($sheetsListIndex, $viewSheetModal + "`n`n            ")

# Save the file
$fixedContent | Set-Content $filePath -NoNewline

Write-Host "✅ Modal moved successfully!" -ForegroundColor Green
Write-Host "✅ File saved: $filePath" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Fix complete! Refresh your browser and test the View button." -ForegroundColor Cyan
