$file = "c:\okulproje\backend\routes\words.js"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Remove the 3 lines that give points immediately
$oldPattern = "    await newWord.save\(\);

    // Öğrenciye puan ekle
    user\.points \+= wordPoints;
    await user\.save\(\);

    res\.json\(\{"

$newPattern = "    await newWord.save();

    res.json({"

$content = [regex]::Replace($content, $oldPattern, $newPattern)

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "Applied fix!"
