$file = "c:\okulproje\frontend\public\app.js"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Add loadUserNotificationCount to showProfilePage
$old = "        loadStudentAnnouncements();
        loadStudentStats();
        loadLeaderboard();
        showPage('profilePage');"

$new = "        loadStudentAnnouncements();
        loadStudentStats();
        loadLeaderboard();
        loadUserNotificationCount();
        showPage('profilePage');"

$content = $content -replace [regex]::Escape($old), $new

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "Added notification count loading!"
