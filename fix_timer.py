import os

file_path = r'c:\Users\AİHL_1\Music\okulproje23\frontend\public\app.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "document.querySelector('[style*=\"⏱️\"]')",
    "document.getElementById('gameTimer')"
)

content = content.replace(
    '                <div style="text-align: center; font-size: 32px; font-weight: bold; color: #2c3e50; margin: 20px 0;">\n                    ⏱️ ${multiplayerState.timeLeft}s\n                </div>',
    '                <div id="gameTimer" style="text-align: center; font-size: 32px; font-weight: bold; color: #2c3e50; margin: 20px 0;">\n                    ⏱️ ${multiplayerState.timeLeft}s\n                </div>'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('OK: Timer selector fixed')
