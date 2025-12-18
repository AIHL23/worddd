$file = "c:\okulproje\backend\routes\words.js"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Remove immediate points from word addition
$old = "    await newWord.save();

    // Öğrenciye puan ekle
    user.points += wordPoints;
    await user.save();

    res.json({
      success: true,
      message: \`Kelime başarıyla eklendi! +\${wordPoints} puan\`,
      word: newWord,
      newPoints: user.points
    });"

$new = "    await newWord.save();

    res.json({
      success: true,
      message: \`Kelime onay için gönderildi! Admin onayından sonra +\${wordPoints} puan alacaksınız.\`,
      word: newWord,
      newPoints: user.points
    });"

$content = $content -replace [regex]::Escape($old), $new

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "Fixed words.js - removed immediate point giveaway!"
