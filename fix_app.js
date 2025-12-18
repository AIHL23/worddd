const fs = require('fs');

const filePath = './frontend/public/app.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
    `async function startMultiplayerGame(gameSessionId) {
    try {
        console.log('🎮 Oyun başlatılıyor:', gameSessionId);`,
    `async function startMultiplayerGame(gameSessionId) {
    try {
        if (!gameSessionId) {
            console.error('❌ gameSessionId undefined:', gameSessionId);
            alert('❌ Oyun oturumu bulunamadı. Lütfen tekrar deneyin.');
            return;
        }
        
        console.log('🎮 Oyun başlatılıyor:', gameSessionId);`
);

content = content.replace(
    `            window.currentGameSession = data.session;
            window.currentGameSessionWords = data.words || [];
            console.log('✅ Kelimeler yüklendi:',`,
    `            window.currentGameSession = data.session;
            window.currentGameSessionWords = data.words || [];
            window.gameSessionId = gameSessionId;
            console.log('✅ Kelimeler yüklendi:',`
);

content = content.replace(
    `            <button class="btn-primary" onclick="endMultiplayerGame()">✅ Oyunu Bitir</button>`,
    `            <button class="btn-primary" onclick="quitMultiplayerGame()">← Oyundan Çık</button>`
);

content = content.replace(
    `async function endMultiplayerGame() {
    try {
        console.log('🏁 Oyun sonlandırılıyor...');`,
    `async function quitMultiplayerGame() {
    if (!confirm('Oyundan çıkmak istediğinize emin misiniz? Oyun iptal edilecektir.')) {
        return;
    }
    
    try {
        if (multiplayerState.timerInterval) {
            clearInterval(multiplayerState.timerInterval);
        }

        if (window.currentGameSession) {
            await fetch(\`\${window.API_URL}/api/games/session/\${window.currentGameSession._id}/abandon\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        }

        showProfilePage();
    } catch (error) {
        console.error('Oyundan çıkış hatası:', error);
        showProfilePage();
    }
}

async function endMultiplayerGame() {
    try {
        console.log('🏁 Oyun sonlandırılıyor...');`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed');
