const fs = require('fs');
const file = 'frontend/public/app.js';
let content = fs.readFileSync(file, 'utf8');

const old = `        loadStudentAnnouncements();
        loadStudentStats();
        loadLeaderboard();
        showPage('profilePage');`;

const newText = `        loadStudentAnnouncements();
        loadStudentStats();
        loadLeaderboard();
        loadUserNotificationCount();
        showPage('profilePage');`;

if (content.includes(old)) {
    content = content.replace(old, newText);
    fs.writeFileSync(file, content, 'utf8');
    console.log('✅ Notification loading added!');
} else {
    console.log('❌ Pattern not found');
}
