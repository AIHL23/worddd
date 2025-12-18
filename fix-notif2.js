const fs = require('fs');
const file = 'frontend/public/app.js';
let content = fs.readFileSync(file, 'utf8');

const old = `        if (data.success) {
            currentUser = data.user;
            messageDiv.innerHTML = '<div class="message success">✅ Giriş başarılı! Yönlendiriliyorsunuz...</div>';
            
            setTimeout(() => {
                if (currentUser.isFirstLogin) {
                    showPage('changePasswordPage');
                } else {
                    showProfilePage();
                }
            }, 1500);`;

const newText = `        if (data.success) {
            currentUser = data.user;
            messageDiv.innerHTML = '<div class="message success">✅ Giriş başarılı! Yönlendiriliyorsunuz...</div>';
            loadUserNotificationCount();
            
            setTimeout(() => {
                if (currentUser.isFirstLogin) {
                    showPage('changePasswordPage');
                } else {
                    showProfilePage();
                }
            }, 1500);`;

if (content.includes(old)) {
    content = content.replace(old, newText);
    fs.writeFileSync(file, content, 'utf8');
    console.log('✅ Notification loading added to login!');
} else {
    console.log('❌ Pattern not found');
}
