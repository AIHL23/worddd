$files = @(
  'c:\okulproje\backend\scripts\debugPassword.js',
  'c:\okulproje\backend\scripts\debug-passwords.js',
  'c:\okulproje\backend\scripts\verifyAllPasswords.js',
  'c:\okulproje\backend\scripts\migratePasswords.js',
  'c:\okulproje\backend\scripts\convertToPlainText.js',
  'c:\okulproje\backend\scripts\fixUserPassword.js',
  'c:\okulproje\backend\scripts\updateUserPassword.js',
  'c:\okulproje\backend\scripts\test-login.js',
  'c:\okulproje\backend\scripts\test-admin.js',
  'c:\okulproje\backend\scripts\test-admin-login.js',
  'c:\okulproje\backend\scripts\simple-test.js',
  'c:\okulproje\backend\scripts\test-endpoints.js'
)

$deleted = 0
foreach ($file in $files) {
  if (Test-Path $file) {
    Remove-Item $file -Force -ErrorAction SilentlyContinue
    $deleted++
    Write-Host "Deleted: $(Split-Path -Leaf $file)"
  }
}
Write-Host "Total deleted: $deleted script files"
