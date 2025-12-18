$file = "c:\okulproje\frontend\public\app.js"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Pattern to find and replace
$pattern = 'if \(data\.success && data\.newPoints\) currentUser\.points = data\.newPoints;'
$replacement = 'if (data.success && data.newPoints) { currentUser.points = data.newPoints; updatePoints(); }'

# Do the replacement
$newContent = [regex]::Replace($content, $pattern, $replacement)

# Write back
[System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "Successfully updated app.js"
