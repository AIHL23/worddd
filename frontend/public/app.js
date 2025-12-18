// Global Error Handlers
window.addEventListener('unhandledrejection', event => {
  console.error('❌ Unhandled Promise Rejection:', event.reason);
});

window.addEventListener('error', event => {
  console.error('❌ Runtime Error:', event.error);
});

// Kullanıcı bilgilerini saklayacağımız değişken
let currentUser = null;
let allWords = [];
let currentEditingWordId = null;

const BADGE_LEVELS = [
  { points: 500, name: 'Bakır', emoji: '🥉', color: '#CD7F32' },
  { points: 1000, name: 'Gümüş', emoji: '🥈', color: '#C0C0C0' },
  { points: 2500, name: 'Altın', emoji: '🥇', color: '#FFD700' },
  { points: 5000, name: 'Elmas', emoji: '💎', color: '#B9F2FF' },
  { points: 10000, name: 'Yıldız', emoji: '⭐', color: '#FFE135' },
  { points: 25000, name: 'Süper Yıldız', emoji: '✨', color: '#FF69B4' },
  { points: 50000, name: 'Efsane', emoji: '🔥', color: '#FF6347' },
  { points: 100000, name: 'Efendi', emoji: '🏰', color: '#FF6347' }
];

// CÜMLE DİL SEÇİMİ DEĞİŞKENLERİ
let selectedSentenceLanguage = 'turkish';
let selectedSentencePoints = 5;

// Sayfa geçiş fonksiyonları
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function switchPage(pageId) {
    showPage(pageId);
}

// DİL SEÇİMİ FONKSİYONU
function initLanguageSelection() {
    const langOptions = document.querySelectorAll('.lang-option');
    
    langOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Aktif sınıfını kaldır
            langOptions.forEach(opt => {
                opt.classList.remove('active');
            });
            
            // Tıklanana aktif sınıfı ekle
            this.classList.add('active');
            
            // Seçilen dili ve puanı güncelle
            selectedSentenceLanguage = this.dataset.lang;
            selectedSentencePoints = parseInt(this.dataset.points);
            
            // Görsel güncellemeler
            document.getElementById('sentencePoints').textContent = selectedSentencePoints;
            document.getElementById('selectedPoints').textContent = selectedSentencePoints;
            
            // Dil adını güncelle
            const langNames = {
                'turkish': 'Türkçe',
                'english': 'İngilizce', 
                'arabic': 'Arapça'
            };
            document.getElementById('selectedLangName').textContent = langNames[selectedSentenceLanguage];
        });
    });
}

// Cümle modal açıldığında dil seçimini başlat
function openSentenceModal(wordId) {
    const word = allWords.find(w => w._id === wordId);
    if (word) {
        currentEditingWordId = wordId;
        document.getElementById('modalWordName').textContent = word.word;
        document.getElementById('modalWordMeaning').textContent = word.meaning;
        document.getElementById('sentenceInput').value = word.sentence || '';
        document.getElementById('sentenceMessage').innerHTML = '';
        
        // Dil seçimini sıfırla (her açılışta Türkçe)
        selectedSentenceLanguage = 'turkish';
        selectedSentencePoints = 5;
        
        // Aktif butonu sıfırla
        document.querySelectorAll('.lang-option').forEach(opt => opt.classList.remove('active'));
        document.querySelector('.lang-option[data-lang="turkish"]').classList.add('active');
        
        // Puan bilgisini güncelle
        document.getElementById('sentencePoints').textContent = '5';
        document.getElementById('selectedPoints').textContent = '5';
        document.getElementById('selectedLangName').textContent = 'Türkçe';
        
        // Cümle onay durumuna göre mesaj göster
        if (word.sentence && word.sentenceStatus === 'pending') {
            document.getElementById('sentenceMessage').innerHTML = 
                '<div class="message warning">⏳ Cümleniz onay bekliyor</div>';
        }
        
        document.getElementById('sentenceModal').classList.add('active');
        
        // Dil seçimini başlat
        setTimeout(initLanguageSelection, 100);
    }
}

// ===================== ADMIN ÖĞRENCI YÖNETİMİ =====================
async function addStudentFromAdmin() {
    const studentIdEl = document.getElementById('adminStudentId');
    const passwordEl = document.getElementById('adminPassword');
    const nameEl = document.getElementById('addStudentName');
    const classEl = document.getElementById('adminClass');

    const studentId = studentIdEl?.value?.trim() || '';
    const password = passwordEl?.value?.trim() || '';
    const name = nameEl?.value?.trim() || '';
    const studentClass = classEl?.value?.trim() || '';

    console.log('Form values:', { studentId, password, name, studentClass });

    if (!studentId) {
        alert('❌ Öğrenci Numarası zorunludur!');
        studentIdEl?.focus();
        return;
    }
    if (!name) {
        alert('❌ Adı Soyadı zorunludur!');
        nameEl?.focus();
        return;
    }
    if (!studentClass) {
        alert('❌ Sınıfı zorunludur!');
        classEl?.focus();
        return;
    }
    if (!password) {
        alert('❌ Geçici Şifre zorunludur!');
        passwordEl?.focus();
        return;
    }

    try {
        const response = await fetch(`${window.API_URL}/api/admin/add-student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, password, name, class: studentClass, role: 'student' })
        });

        const data = await response.json();
        console.log('Server response:', data);
        
        if (data.success) {
            alert('✅ ' + data.message);
            studentIdEl.value = '';
            passwordEl.value = '';
            nameEl.value = '';
            classEl.value = '';
            await loadAdminStudentsList();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        console.error('Öğrenci ekleme hatası:', error);
        alert('❌ Sunucu hatası: ' + error.message);
    }
}

async function addTeacherFromAdmin() {
    const teacherIdEl = document.getElementById('adminTeacherId');
    const passwordEl = document.getElementById('adminTeacherPassword');
    const nameEl = document.getElementById('addTeacherName');

    const teacherId = teacherIdEl?.value?.trim() || '';
    const password = passwordEl?.value?.trim() || '';
    const name = nameEl?.value?.trim() || '';

    console.log('Teacher form values:', { teacherId, password, name });

    if (!teacherId) {
        alert('❌ Öğretmen Numarası zorunludur!');
        teacherIdEl?.focus();
        return;
    }
    if (!name) {
        alert('❌ Adı Soyadı zorunludur!');
        nameEl?.focus();
        return;
    }
    if (!password) {
        alert('❌ Geçici Şifre zorunludur!');
        passwordEl?.focus();
        return;
    }

    try {
        const response = await fetch(`${window.API_URL}/api/admin/add-teacher`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: teacherId, password, name })
        });

        const data = await response.json();
        console.log('Server response:', data);
        
        if (data.success) {
            alert('✅ ' + data.message);
            teacherIdEl.value = '';
            passwordEl.value = '';
            nameEl.value = '';
            await loadAdminTeachersList();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        console.error('Öğretmen ekleme hatası:', error);
        alert('❌ Sunucu hatası: ' + error.message);
    }
}

async function banStudentFromAdmin() {
    const studentId = document.getElementById('banStudentId')?.value || '';
    const banReason = document.getElementById('banReason')?.value || '';

    if (!studentId) {
        alert('❌ Öğrenci numarasını girin!');
        return;
    }

    try {
        const response = await fetch(`${window.API_URL}/api/admin/ban-student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, banReason })
        });

        const data = await response.json();
        if (data.success) {
            alert('✅ ' + data.message);
            document.getElementById('banStudentId').value = '';
            document.getElementById('banReason').value = '';
            await loadAdminStudentsList();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası!');
    }
}

async function resetAllPoints() {
    if (!confirm('⚠️ TÜM ÖĞRENCİLERİN PUANLARI SİLİNECEKTİR! Emin misiniz?')) {
        return;
    }

    if (!confirm('🔴 Son uyarı: Bu işlem geri alınamaz!')) {
        return;
    }

    try {
        const response = await fetch(`${window.API_URL}/api/admin/reset-all-points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        if (data.success) {
            alert('✅ ' + data.message);
            await loadAdminStudentsList();
            await loadGameStatistics();
            await loadWeeklyTopStudents();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası: ' + error.message);
    }
}

async function unbanStudent(studentId) {
    try {
        const response = await fetch(`${window.API_URL}/api/admin/unban-student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId })
        });

        const data = await response.json();
        if (data.success) {
            alert('✅ ' + data.message);
            await loadAdminStudentsList();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası!');
    }
}

async function loadAdminStudentsList() {
    try {
        const response = await fetch(`${window.API_URL}/api/admin/all-students`);
        const data = await response.json();

        if (data.success) {
            const listDiv = document.getElementById('adminStudentsList') || createAdminStudentsListElement();
            listDiv.innerHTML = data.students.map(student => `
                <div class="admin-item">
                    <div class="item-info">
                        <strong>${student.name}</strong> (${student.studentId})<br>
                        <small>Sınıf: ${student.class} | Puanlar: ${student.points}</small>
                    </div>
                    <div class="item-actions">
                        <span class="status ${student.isBanned ? 'banned' : 'active'}">
                            ${student.isBanned ? '🚫 Yasaklı' : '✅ Aktif'}
                        </span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Öğrenci listesi yükleme hatası:', error);
    }
}

async function loadAdminBannedStudents() {
    try {
        const response = await fetch(`${window.API_URL}/api/admin/banned-students`);
        const data = await response.json();

        if (data.success) {
            const listDiv = document.getElementById('adminBannedStudentsList') || createAdminBannedListElement();
            listDiv.innerHTML = data.bannedStudents.length > 0 ? data.bannedStudents.map(student => `
                <div class="admin-item">
                    <div class="item-info">
                        <strong>${student.name}</strong> (${student.studentId})<br>
                        <small>Sebep: ${student.banReason}</small>
                    </div>
                    <div class="item-actions">
                        <button class="btn-unban" onclick="unbanStudent('${student.studentId}')">✅ Yasaklamayı Kaldır</button>
                    </div>
                </div>
            `).join('') : '<p>Yasaklı öğrenci yok</p>';
        }
    } catch (error) {
        console.error('Yasaklı öğrenci listesi hatası:', error);
    }
}

function createAdminStudentsListElement() {
    const div = document.createElement('div');
    div.id = 'adminStudentsList';
    return div;
}

function createAdminBannedListElement() {
    const div = document.createElement('div');
    div.id = 'adminBannedStudentsList';
    return div;
}

async function loadAdminTeachersList() {
    try {
        const response = await fetch(`${window.API_URL}/api/admin/all-teachers`);
        const data = await response.json();

        if (data.success) {
            const listDiv = document.getElementById('adminTeachersList') || createAdminTeachersListElement();
            listDiv.innerHTML = data.teachers && data.teachers.length > 0 ? data.teachers.map(teacher => `
                <div class="admin-item">
                    <div class="item-info">
                        <strong>${teacher.name}</strong> (${teacher.studentId})<br>
                        <small>Kayıt: ${new Date(teacher.createdAt).toLocaleDateString('tr-TR')}</small>
                    </div>
                    <div class="item-actions">
                        <span class="status active">👨‍🏫 Öğretmen</span>
                    </div>
                </div>
            `).join('') : '<p>Öğretmen yok</p>';
        }
    } catch (error) {
        console.error('Öğretmen listesi yükleme hatası:', error);
    }
}

function createAdminTeachersListElement() {
    const div = document.createElement('div');
    div.id = 'adminTeachersList';
    return div;
}

// ADMIN PANELİ FONKSİYONLARI - GERÇEK BACKEND BAĞLANTILI
async function showAdminPage() {
    if (currentUser && currentUser.role === 'admin') {
        showPage('adminPage');
        await loadAdminData();
    } else {
        alert('❌ Admin yetkiniz yok!');
    }
}

// ✅ ADMIN PANEL MODERN FEATURES

async function createAnnouncement() {
    const title = document.getElementById('announcementTitle').value;
    const content = document.getElementById('announcementContent').value;
    const type = document.getElementById('announcementType').value;
    const priority = document.getElementById('announcementPriority').value;

    if (!title || !content) {
        alert('❌ Başlık ve içerik zorunludur!');
        return;
    }

    try {
        const response = await fetch(`${window.API_URL}/api/admin/announcement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                content,
                type,
                priority,
                adminId: currentUser.studentId,
                adminName: currentUser.name
            })
        });

        const data = await response.json();
        if (data.success) {
            alert('✅ Duyuru başarıyla gönderildi!');
            document.getElementById('announcementTitle').value = '';
            document.getElementById('announcementContent').value = '';
            loadAnnouncements();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Duyuru gönderme hatası: ' + error.message);
    }
}

async function loadAnnouncements() {
    try {
        const response = await fetch(`${window.API_URL}/api/admin/announcements`);
        const data = await response.json();

        if (data.success) {
            const list = document.getElementById('announcementsListContent');
            list.innerHTML = data.announcements.map(ann => `
                <div class="announcement-card ${ann.type}">
                    <div class="announcement-card-header">
                        <h4>${ann.title}</h4>
                        <div>
                            <span class="announcement-type-badge">${ann.type.toUpperCase()}</span>
                            <button class="btn-delete-ann" onclick="deleteAnnouncement('${ann._id}')">🗑️</button>
                        </div>
                    </div>
                    <div class="announcement-card-content">${ann.content}</div>
                    <div class="announcement-card-footer">
                        <span>Yazan: ${ann.adminName}</span>
                        <span>${new Date(ann.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Duyuru yükleme hatası:', error);
    }
}

async function deleteAnnouncement(announcementId) {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`${window.API_URL}/api/admin/delete-announcement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                announcementId,
                adminId: currentUser.studentId,
                adminName: currentUser.name
            })
        });

        const data = await response.json();
        if (data.success) {
            alert('✅ Duyuru başarıyla silindi!');
            loadAnnouncements();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Duyuru silme hatası: ' + error.message);
    }
}

async function loadGameStatistics() {
    try {
        const response = await fetch(`${window.API_URL}/api/admin/game-statistics`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalPlayers').textContent = data.summary.totalPlayers;
            document.getElementById('totalGames').textContent = data.summary.totalGames;
            document.getElementById('flashcardGames').textContent = data.summary.gameStats.flashcard;
            document.getElementById('matchingGames').textContent = data.summary.gameStats.matching;
            document.getElementById('averageAccuracy').textContent = data.summary.averageAccuracy + '%';
        }
    } catch (error) {
        console.error('İstatistik yükleme hatası:', error);
    }
}

async function loadWeeklyTopStudents() {
    try {
        const response = await fetch(`${window.API_URL}/api/admin/weekly-statistics`);
        const data = await response.json();

        if (data.success) {
            const list = document.getElementById('weeklyTopStudents');
            list.innerHTML = data.topStudents.map((student, index) => `
                <div class="admin-item" style="border-left-color: ${index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : '#d4af37'};">
                    <div class="admin-item-header">
                        <div class="admin-item-title">
                            ${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} ${student.studentName} (${student.studentClass})
                        </div>
                        <div>${student.totalPointsEarned} puan</div>
                    </div>
                    <div style="color: var(--text-secondary); font-size: 12px;">
                        ${student.actionCount} işlem
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Haftalık istatistik hatası:', error);
    }
}

async function loadAdminLogs() {
    const actionFilter = document.getElementById('logActionFilter').value;
    try {
        const url = new URL(`${window.API_URL}/api/admin/logs`);
        if (actionFilter) url.searchParams.append('action', actionFilter);

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            const list = document.getElementById('adminLogsList');
            list.innerHTML = data.logs.map(log => `
                <div class="log-card ${log.status === 'error' ? 'error' : ''}">
                    <div class="log-card-content">
                        <div class="log-action">
                            ${log.action.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div class="log-details">
                            Admin: ${log.adminName} 
                            ${log.targetName ? `| Hedef: ${log.targetName}` : ''}
                            ${log.reason ? `| Sebep: ${log.reason}` : ''}
                        </div>
                    </div>
                    <div class="log-time">
                        ${new Date(log.createdAt).toLocaleString('tr-TR')}
                    </div>
                </div>
            `).join('') || '<p>Log bulunamadı</p>';
        }
    } catch (error) {
        console.error('Log yükleme hatası:', error);
    }
}

function showAdminTab(tabName) {
    // Tab butonlarını güncelle
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Tab içeriklerini güncelle
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const tabIdMap = {
        'students': 'adminStudentsTab',
        'words': 'adminWordsTab',
        'sentences': 'adminSentencesTab',
        'announcements': 'adminAnnouncementsTab',
        'statistics': 'adminStatisticsTab',
        'ai': 'adminAiTab',
        'feedback': 'adminFeedbackTab',
        'logs': 'adminLogsTab'
    };
    
    const tabId = tabIdMap[tabName] || 'admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Tab';
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
        tabElement.classList.add('active');
        
        if (tabName === 'students') {
            loadAdminStudentsList();
            loadAdminBannedStudents();
        } else if (tabName === 'words') {
            loadPendingWords();
            loadAllApprovedWords();
        } else if (tabName === 'sentences') {
            loadPendingSentences();
        } else if (tabName === 'announcements') {
            loadAnnouncements();
        } else if (tabName === 'statistics') {
            loadGameStatistics();
            loadWeeklyTopStudents();
        } else if (tabName === 'ai') {
            clearAdminAiChat();
        } else if (tabName === 'feedback') {
            loadAdminFeedbacks();
        } else if (tabName === 'logs') {
            loadAdminLogs();
        }
    }
}

async function loadAdminData() {
    // Admin verilerini backend'den yükle
    await loadPendingWords();
    await loadPendingSentences();
    await loadAdminStudentsList();
    await loadAdminTeachersList();
    await loadAdminBannedStudents();
}

// GERÇEK: Backend'den onay bekleyen kelimeleri çek
async function loadPendingWords() {
    try {
        const response = await fetch(`${window.API_URL}/api/admin/pending-words`);
        const data = await response.json();
        
        if (data.success) {
            displayPendingWords(data.pendingWords);
        } else {
            document.getElementById('pendingWordsList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <h3>Veri yüklenemedi</h3>
                </div>
            `;
        }
    } catch (error) {
        console.error('Admin kelime yükleme hatası:', error);
        document.getElementById('pendingWordsList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔌</div>
                <h3>Sunucu bağlantı hatası</h3>
                <p>Backend çalışıyor mu kontrol edin</p>
            </div>
        `;
    }
}

function displayPendingWords(words) {
    const pendingWordsList = document.getElementById('pendingWordsList');
    
    if (!words || words.length === 0) {
        pendingWordsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <h3>Onay bekleyen kelime yok</h3>
            </div>
        `;
        return;
    }
    
    pendingWordsList.innerHTML = words.map(word => `
        <div class="admin-item">
            <div class="item-info">
                <span class="lang-badge">${getLanguageFlag(word.language)} ${word.language.toUpperCase()}</span>
                <strong>${word.word}</strong> - ${word.meaning}
                <br>
                <small>Ekleyen: ${word.studentName} • ${formatTime(word.createdAt)}</small>
                
                ${word.aiValidated ? `
                <div style="margin-top:8px; padding:8px; background:rgba(102,126,234,0.1); border-radius:6px; font-size:12px;">
                    <strong>🤖 AI Karar:</strong> 
                    ${word.aiDecision === 'APPROVE' ? '✅ ONAYLA' : '❌ REDDET'} 
                    (Skor: ${word.aiScore}/100)
                    <br>
                    <em>${word.aiReason}</em>
                </div>
                ` : ''}
            </div>
            <div class="item-actions">
                <button class="btn-approve" onclick="approveWord('${word._id}')">✅ Onayla</button>
                <button class="btn-reject" onclick="rejectWord('${word._id}')">❌ Reddet</button>
                <button class="btn-delete" onclick="deleteWord('${word._id}')">🗑️ Sil</button>
            </div>
        </div>
    `).join('');
}

// GERÇEK: Backend'den onay bekleyen cümleleri çek
async function loadPendingSentences() {
    try {
        const response = await fetch(`${window.API_URL}/api/admin/pending-words`);
        const data = await response.json();
        
        if (data.success) {
            displayPendingSentences(data.pendingSentences);
        } else {
            document.getElementById('pendingSentencesList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <h3>Veri yüklenemedi</h3>
                </div>
            `;
        }
    } catch (error) {
        console.error('Admin cümle yükleme hatası:', error);
        document.getElementById('pendingSentencesList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔌</div>
                <h3>Sunucu bağlantı hatası</h3>
            </div>
        `;
    }
}

function displayPendingSentences(sentences) {
    const pendingSentencesList = document.getElementById('pendingSentencesList');
    
    if (!sentences || sentences.length === 0) {
        pendingSentencesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <h3>Onay bekleyen cümle yok</h3>
            </div>
        `;
        return;
    }
    
    pendingSentencesList.innerHTML = sentences.map(word => `
        <div class="admin-item">
            <div class="item-info">
                <span class="lang-badge">${getLanguageFlag(word.sentenceLanguage)} ${(word.sentenceLanguage || 'UNKNOWN').toUpperCase()}</span>
                <strong>Kelime:</strong> ${word.word}
                <br>
                <strong>Cümle:</strong> "${word.sentence}"
                <br>
                <small>Ekleyen: ${word.studentName} • ${formatTime(word.createdAt)}</small>
                
                ${word.aiValidated ? `
                <div style="margin-top:8px; padding:8px; background:rgba(102,126,234,0.1); border-radius:6px; font-size:12px;">
                    <strong>🤖 AI Karar:</strong> 
                    ${word.aiDecision === 'APPROVE' ? '✅ ONAYLA' : '❌ REDDET'} 
                    (Skor: ${word.aiScore}/100)
                    <br>
                    <em>${word.aiReason}</em>
                </div>
                ` : ''}
            </div>
            <div class="item-actions">
                <button class="btn-approve" onclick="approveSentence('${word._id}')">✅ Onayla</button>
                <button class="btn-reject" onclick="rejectSentence('${word._id}')">❌ Reddet</button>
                <button class="btn-delete" onclick="deleteSentence('${word._id}')">🗑️ Sil</button>
            </div>
        </div>
    `).join('');
}

// Tüm onaylanmış kelimeleri yükle
async function loadAllApprovedWords() {
    try {
        console.log('📚 Onaylanmış kelimeler yükleniyor...');
        const response = await fetch(`${window.API_URL}/api/admin/all-approved-words`);
        
        console.log('📡 Response Status:', response.status);
        console.log('📡 Response Type:', response.headers.get('content-type'));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ HTML yanıt alındı:', text.substring(0, 200));
            throw new Error('Server JSON yerine HTML döndürüyor. Backend kapalı veya endpoint hatalı olabilir.');
        }
        
        const data = await response.json();
        
        console.log('📚 API Cevap:', data);
        
        if (data.success && data.words) {
            console.log(`✅ ${data.words.length} kelime bulundu`);
            displayAllApprovedWords(data.words);
        } else {
            console.warn('⚠️ Başarısız cevap:', data);
            displayAllApprovedWords([]);
        }
    } catch (error) {
        console.error('❌ Onaylanmış kelimeler yükleme hatası:', error);
        const allApprovedWordsList = document.getElementById('allApprovedWordsList');
        if (allApprovedWordsList) {
            allApprovedWordsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔌</div>
                    <h3>Sunucu Hatası</h3>
                    <p style="color: #d9534f; font-weight: 500;">${error.message}</p>
                    <p style="font-size: 12px; color: #666; margin-top: 10px;">
                        💡 Çözüm: Backend'i yeniden başlat<br>
                        <code style="background: #f5f5f5; padding: 2px 5px; border-radius: 3px;">npm start</code>
                    </p>
                </div>
            `;
        }
    }
}

// Tüm onaylanmış kelimeleri göster
function displayAllApprovedWords(words) {
    const allApprovedWordsList = document.getElementById('allApprovedWordsList');
    
    if (!words || words.length === 0) {
        allApprovedWordsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>Onaylanmış kelime yok</h3>
            </div>
        `;
        document.getElementById('totalApprovedWordsCount').textContent = '0';
        document.getElementById('turkishWordsCount').textContent = '0';
        document.getElementById('englishWordsCount').textContent = '0';
        document.getElementById('arabicWordsCount').textContent = '0';
        document.getElementById('allWordsCount').textContent = '0';
        return;
    }
    
    window.allApprovedWordsCache = words;
    
    // Dil istatistikleri hesapla
    const turkishCount = words.filter(w => w.language === 'turkish').length;
    const englishCount = words.filter(w => w.language === 'english').length;
    const arabicCount = words.filter(w => w.language === 'arabic').length;
    
    document.getElementById('totalApprovedWordsCount').textContent = words.length;
    document.getElementById('turkishWordsCount').textContent = turkishCount;
    document.getElementById('englishWordsCount').textContent = englishCount;
    document.getElementById('arabicWordsCount').textContent = arabicCount;
    document.getElementById('allWordsCount').textContent = words.length;
    
    allApprovedWordsList.innerHTML = words.map(word => `
        <div class="admin-item">
            <div class="item-info">
                <span class="lang-badge">${getLanguageFlag(word.language)} ${word.language.toUpperCase()}</span>
                <strong>${word.word}</strong> - ${word.meaning}
                <br>
                <small>Ekleyen: ${word.studentName} • ${formatTime(word.createdAt)}</small>
                ${word.sentence ? `<br><em>Cümle: "${word.sentence}"</em>` : ''}
            </div>
            <div class="item-actions">
                <button class="btn-delete" onclick="deleteApprovedWord('${word._id}')">🗑️ Sil</button>
            </div>
        </div>
    `).join('');
}

// Onaylanmış kelimelerde arama
function searchAllWords() {
    const searchInput = document.getElementById('allWordsSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const allApprovedWordsList = document.getElementById('allApprovedWordsList');
    
    if (!window.allApprovedWordsCache) return;
    
    if (searchTerm.length === 0) {
        displayAllApprovedWords(window.allApprovedWordsCache);
        return;
    }
    
    const filtered = window.allApprovedWordsCache.filter(word => 
        word.word.toLowerCase().includes(searchTerm) || 
        word.meaning.toLowerCase().includes(searchTerm) ||
        (word.studentName && word.studentName.toLowerCase().includes(searchTerm))
    );
    
    if (filtered.length === 0) {
        allApprovedWordsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Sonuç bulunamadı</h3>
                <p>"${searchTerm}" ile eşleşen kelime yok</p>
            </div>
        `;
        document.getElementById('allWordsCount').textContent = '0';
    } else {
        // Dil istatistikleri hesapla
        const turkishCount = filtered.filter(w => w.language === 'turkish').length;
        const englishCount = filtered.filter(w => w.language === 'english').length;
        const arabicCount = filtered.filter(w => w.language === 'arabic').length;
        
        document.getElementById('totalApprovedWordsCount').textContent = filtered.length;
        document.getElementById('turkishWordsCount').textContent = turkishCount;
        document.getElementById('englishWordsCount').textContent = englishCount;
        document.getElementById('arabicWordsCount').textContent = arabicCount;
        document.getElementById('allWordsCount').textContent = filtered.length;
        
        allApprovedWordsList.innerHTML = filtered.map(word => `
            <div class="admin-item">
                <div class="item-info">
                    <span class="lang-badge">${getLanguageFlag(word.language)} ${word.language.toUpperCase()}</span>
                    <strong>${word.word}</strong> - ${word.meaning}
                    <br>
                    <small>Ekleyen: ${word.studentName} • ${formatTime(word.createdAt)}</small>
                    ${word.sentence ? `<br><em>Cümle: "${word.sentence}"</em>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn-delete" onclick="deleteApprovedWord('${word._id}')">🗑️ Sil</button>
                </div>
            </div>
        `).join('');
    }
}

// Onaylanmış kelimeyi sil
async function deleteApprovedWord(wordId) {
    if(!confirm('⚠️ Bu kelimeyi tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
    
    try {
        const response = await fetch(`${window.API_URL}/api/admin/delete-word`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: wordId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('🗑️ ' + data.message);
            await loadAllApprovedWords();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası!');
    }
}

// GERÇEK: Backend'e kelime onaylama isteği gönder
async function approveWord(wordId) {
    if(!confirm('Bu kelimeyi onaylamak istediğinize emin misiniz?\nÖğrenciye +10 puan verilecek.')) return;
    
    try {
        const response = await fetch(`${window.API_URL}/api/admin/word-action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: wordId,
                action: 'approve',
                adminId: currentUser.studentId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ ' + data.message);
            await loadPendingWords(); // Listeyi yenile
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası! Backend çalışıyor mu?');
    }
}

// GERÇEK: Backend'e kelime reddetme isteği gönder
async function rejectWord(wordId) {
    const reason = prompt('Reddetme sebebini yazın:');
    if (!reason) return;
    
    try {
        const response = await fetch(`${window.API_URL}/api/admin/word-action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: wordId,
                action: 'reject',
                adminId: currentUser.studentId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('❌ ' + data.message);
            await loadPendingWords(); // Listeyi yenile
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası!');
    }
}

// GERÇEK: Backend'e cümle onaylama isteği gönder
async function approveSentence(wordId) {
    if(!confirm('Bu cümleyi onaylamak istediğinize emin misiniz?')) return;
    
    try {
        const response = await fetch(`${window.API_URL}/api/admin/sentence-action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: wordId,
                action: 'approve',
                adminId: currentUser.studentId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ ' + data.message);
            await loadPendingSentences(); // Listeyi yenile
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası!');
    }
}

// GERÇEK: Backend'e cümle reddetme isteği gönder
async function rejectSentence(wordId) {
    const reason = prompt('Reddetme sebebini yazın:');
    if (!reason) return;
    
    try {
        const response = await fetch(`${window.API_URL}/api/admin/sentence-action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: wordId,
                action: 'reject',
                adminId: currentUser.studentId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('❌ ' + data.message);
            await loadPendingSentences(); // Listeyi yenile
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası!');
    }
}

async function deleteWord(wordId) {
    if(!confirm('⚠️ Bu kelimeyi tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
    
    try {
        const response = await fetch(`${window.API_URL}/api/admin/delete-word`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: wordId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('🗑️ ' + data.message);
            await loadPendingWords();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası!');
    }
}

async function deleteSentence(wordId) {
    if(!confirm('⚠️ Bu cümleyi silmek istediğinize emin misiniz?')) return;
    
    try {
        const response = await fetch(`${window.API_URL}/api/admin/delete-sentence`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: wordId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('🗑️ ' + data.message);
            await loadPendingSentences();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası!');
    }
}

// Zaman formatlama
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR');
}

// Login form işleyici
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('studentId').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    
    try {
        console.log('Login isteği yapılıyor:', `${window.API_URL}/api/auth/login`);
        const response = await fetch(`${window.API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentId, password })
        });
        
        console.log('Yanıt alındı:', response.status);
        const data = await response.json();
        console.log('JSON parse edildi:', data);
        console.log('User data:', data.user);
        
        if (data.success) {
            currentUser = data.user;
            console.log('Current user set:', currentUser);
            messageDiv.innerHTML = '<div class="message success">✅ Giriş başarılı! Yönlendiriliyorsunuz...</div>';
            
            if (currentUser) {
                loadUserNotificationCount();
            }
            
            setTimeout(() => {
                if (currentUser.isFirstLogin) {
                    showPage('changePasswordPage');
                } else {
                    showProfilePage();
                }
            }, 1500);
            
        } else {
            messageDiv.innerHTML = '<div class="message error">❌ ' + data.message + '</div>';
        }
    } catch (error) {
        console.error('Login hatası:', error);
        messageDiv.innerHTML = '<div class="message error">❌ Sunucu bağlantı hatası! Kontrol panelinde hata detayını görebilirsiniz.</div>';
    }
});

// Şifre değiştirme form işleyici
document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const kvkkConsent = document.getElementById('kvkkConsent').checked;
    const messageDiv = document.getElementById('passwordMessage');
    
    if (newPassword !== confirmPassword) {
        messageDiv.innerHTML = '<div class="message error">❌ Şifreler eşleşmiyor!</div>';
        return;
    }
    
    if (newPassword.length < 6) {
        messageDiv.innerHTML = '<div class="message error">❌ Şifre en az 6 karakter olmalı!</div>';
        return;
    }

    if (!kvkkConsent) {
        messageDiv.innerHTML = '<div class="message error">❌ KVKK Onayını kabul etmelisiniz!</div>';
        return;
    }
    
    try {
        const response = await fetch(`${window.API_URL}/api/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                studentId: currentUser.studentId, 
                newPassword: newPassword,
                kvkkApproved: kvkkConsent
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="message success">✅ Şifre başarıyla değiştirildi!</div>';
            
            setTimeout(() => {
                showProfilePage();
            }, 2000);
            
        } else {
            messageDiv.innerHTML = '<div class="message error">❌ ' + data.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="message error">❌ Şifre değiştirme hatası!</div>';
    }
});

// Kelime ekleme form işleyici
document.getElementById('wordAddForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const word = document.getElementById('wordInput').value;
    const meaning = document.getElementById('wordMeaning').value;
    const messageDiv = document.getElementById('wordMessage');
    const language = document.getElementById('wordAddTitle').textContent.includes('Türkçe') ? 'turkish' : 
                    document.getElementById('wordAddTitle').textContent.includes('İngilizce') ? 'english' : 'arabic';
    
    try {
        const response = await fetch(`${window.API_URL}/api/words/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                word, 
                meaning,
                language, 
                studentId: currentUser.studentId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="message success">✅ ' + data.message + '</div>';
            
            // Formu temizle
            document.getElementById('wordAddForm').reset();
            
            // 2 saniye sonra profil sayfasına dön
            setTimeout(() => {
                showProfilePage();
            }, 2000);
        } else {
            messageDiv.innerHTML = '<div class="message error">❌ ' + data.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="message error">❌ Kelime ekleme hatası!</div>';
    }
});

// CÜMLE EKLEME FORM İŞLEYİCİSİ - GÜNCELLENDİ
document.getElementById('sentenceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const sentence = document.getElementById('sentenceInput').value;
    const messageDiv = document.getElementById('sentenceMessage');
    
    try {
        const response = await fetch(`${window.API_URL}/api/words/add-sentence`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: currentEditingWordId, 
                sentence, 
                studentId: currentUser.studentId,
                sentenceLanguage: selectedSentenceLanguage // YENİ: DİL BİLGİSİ EKLENDİ
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="message success">✅ ' + data.message + '</div>';
            
            // Kelime listesini güncelle
            await loadAllWords();
            
            // 2 saniye sonra modal'ı kapat
            setTimeout(() => {
                closeSentenceModal();
            }, 2000);
        } else {
            messageDiv.innerHTML = '<div class="message error">❌ ' + data.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="message error">❌ Cümle ekleme hatası!</div>';
    }
});

// Profil sayfasını göster
function showProfilePage() {
    if (currentUser) {
        showPage('profilePage');
        
        const avatar = currentUser.avatar || '😊';
        const headerBtn = document.getElementById('headerProfileBtn');
        if (headerBtn) {
            headerBtn.textContent = avatar;
        }
        
        if (matchingState.timerInterval) {
            clearInterval(matchingState.timerInterval);
            matchingState.timerInterval = null;
        }
        
        const adminCardInGames = document.getElementById('adminCardInGames');
        if (adminCardInGames) {
            adminCardInGames.style.display = currentUser.role === 'admin' ? 'flex' : 'none';
        }
        
        const adminCardInWords = document.getElementById('adminCardInWords');
        if (adminCardInWords) {
            adminCardInWords.style.display = currentUser.role === 'admin' ? 'flex' : 'none';
        }
        
        loadStudentAnnouncements();
        loadStudentStats();
        loadLeaderboard();
        loadUserNotificationCount();
    }
}

function switchProfileTab(tabName) {
    const tabs = document.querySelectorAll('.profile-tab-content');
    const btns = document.querySelectorAll('.profile-tabs .tab-btn');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    btns.forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeTab = document.getElementById(`profileTab-${tabName}`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    const activeBtn = Array.from(btns).find(btn => btn.getAttribute('onclick')?.includes(`'${tabName}'`));
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

async function loadStudentAnnouncements() {
    try {
        // API endpoint'i düzeltildi: /api/words/announcements yerine /api/admin/announcements
        // Çünkü duyurular admin tarafından oluşturuluyor ve genel bir endpoint olmalı
        const response = await fetch(`${window.API_URL}/api/admin/announcements`);
        const data = await response.json();

        if (data.success && data.announcements.length > 0) {
            const section = document.getElementById('announcementsSection');
            if (!section) return;
            
            const list = document.getElementById('studentAnnouncementsList');
            
            section.style.display = 'block';
            list.innerHTML = data.announcements.map(ann => `
                <div class="student-announcement-card ${ann.type}">
                    <div class="student-announcement-title">
                        <span>${ann.title}</span>
                        <span class="announcement-badge">${ann.type.toUpperCase()}</span>
                    </div>
                    <div class="student-announcement-content">${ann.content}</div>
                    <div class="student-announcement-footer">
                        <span>Yazan: ${ann.adminName}</span>
                        <span>${new Date(ann.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
            `).join('');
        } else {
            const section = document.getElementById('announcementsSection');
            if (section) {
                section.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Duyurular yüklenirken hata:', error);
        const section = document.getElementById('announcementsSection');
        if (section) {
            section.style.display = 'none';
        }
    }
}

async function loadStudentStats() {
    try {
        const response = await fetch(`${window.API_URL}/api/words/student-stats/${currentUser.studentId}`);
        if (!response.ok) {
            console.error('API Hatası:', response.status);
            return;
        }
        const data = await response.json();

        if (data.success) {
            const stats = data.stats;
            const elMyPoints = document.getElementById('myPoints');
            const elMyRank = document.getElementById('myRank');
            const elMyWords = document.getElementById('myWords');
            const elMyGames = document.getElementById('myGames');
            const elMetaRank = document.getElementById('profileMetaRank');
            const elMetaPoints = document.getElementById('profileMetaPoints');
            const elMetaWords = document.getElementById('profileMetaWords');
            const elMetaGames = document.getElementById('profileMetaGames');
            
            if (elMyPoints) elMyPoints.textContent = stats.points;
            if (elMyRank) elMyRank.textContent = '#' + stats.rank;
            if (elMyWords) elMyWords.textContent = stats.approvedWords;
            if (elMyGames) elMyGames.textContent = stats.gamesPlayed;
            
            if (elMetaRank) elMetaRank.textContent = '#' + stats.rank;
            if (elMetaPoints) elMetaPoints.textContent = stats.points;
            if (elMetaWords) elMetaWords.textContent = stats.approvedWords;
            if (elMetaGames) elMetaGames.textContent = stats.gamesPlayed;
        }
    } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
    }
}

async function loadLeaderboard() {
    try {
        const response = await fetch(`${window.API_URL}/api/words/leaderboard?limit=20`);
        const data = await response.json();

        if (data.success) {
            const list = document.getElementById('leaderboardList');
            list.innerHTML = data.leaderboard.map((item, index) => `
                <div class="leaderboard-item ${index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : ''}">
                    <div class="leaderboard-rank">${item.medal}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${item.name}</div>
                        <div class="leaderboard-class">${item.class}</div>
                    </div>
                    <div class="leaderboard-games">
                        <div class="leaderboard-games-value">${item.gamesPlayed}</div>
                        <div>oyun</div>
                    </div>
                    <div class="leaderboard-points">
                        <div class="leaderboard-points-value">${item.points}</div>
                        <div class="leaderboard-points-label">puan</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Puan tablosu yüklenirken hata:', error);
    }
}

// Kelime ekleme sayfasını göster
function showWordAddPage(language) {
    const titles = {
        'turkish': '🇹🇷 Türkçe Kelime Ekle',
        'english': '🇺🇸 İngilizce Kelime Ekle', 
        'arabic': '🇸🇦 Arapça Kelime Ekle'
    };

    const pointsMap = {
        'turkish': 10,
        'english': 25,
        'arabic': 50
    };
    
    document.getElementById('wordAddTitle').textContent = titles[language];
    const points = pointsMap[language] || 10;
    document.getElementById('wordAddPointsInfo').innerHTML = `✅ Admin onayından sonra <strong>+${points} puan</strong>`;
    document.getElementById('wordMessage').innerHTML = '';
    document.getElementById('wordAddForm').reset();
    showPage('wordAddPage');
}

// TÜM KELİMELER sayfasını göster
async function showAllWordsPage() {
    if (currentUser) {
        document.getElementById('allWordsPoints').textContent = currentUser.points;
        showPage('allWordsPage');
        await loadAllWords();
    }
}

// Tüm kelimeleri yükle
async function loadAllWords() {
    try {
        const response = await fetch(`${window.API_URL}/api/words/all`);
        const data = await response.json();
        
        if (data.success) {
            allWords = data.words;
            renderWords();
        }
    } catch (error) {
        console.error('Kelimeleri yükleme hatası:', error);
    }
}

// Kelimeleri ekrana render et
function renderWords() {
    const wordsGrid = document.getElementById('wordsGrid');
    const wordsCount = document.getElementById('wordsCount');
    
    wordsCount.textContent = allWords.length;
    
    if (allWords.length === 0) {
        wordsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>Henüz kelime eklenmemiş</h3>
                <p>İlk kelimeyi eklemek için yukarıdaki butonları kullanın</p>
            </div>
        `;
        return;
    }
    
    wordsGrid.innerHTML = allWords.map(word => {
        // Kullanıcının bu kelimeye oy verip vermediğini kontrol et
        const userVote = word.votedUsers && currentUser ? word.votedUsers.find(vote => vote.studentId === currentUser.studentId) : null;
        const hasUserVoted = !!userVote;
        const userVoteType = userVote ? userVote.voteType : null;
        
        // Cümle durumunu kontrol et
        const canAddSentence = !word.sentence || word.sentenceStatus === 'pending';
        const hasApprovedSentence = word.sentence && word.sentenceStatus === 'approved';
        
        return `
        <div class="word-card">
            <div class="word-header">
                <div class="word-title">${word.word}</div>
                <div class="word-language">${getLanguageFlag(word.language)}</div>
            </div>
            
            <div class="word-meaning-preview">${word.meaning}</div>
            
            ${hasApprovedSentence ? `
                <div class="sentence-preview">
                    <strong>💬 Cümle:</strong> ${word.sentence}
                </div>
            ` : word.sentence && word.sentenceStatus === 'pending' ? `
                <div class="sentence-preview pending">
                    <strong>⏳ Cümle:</strong> ${word.sentence} <em>(Onay bekliyor)</em>
                </div>
            ` : ''}
            
            <div class="word-stats">
                <div class="word-stat ${userVoteType === 'like' ? 'user-vote' : ''}">
                    <span class="stat-icon">👍</span> ${word.likes || 0}
                </div>
                <div class="word-stat ${userVoteType === 'dislike' ? 'user-vote' : ''}">
                    <span class="stat-icon">👎</span> ${word.dislikes || 0}
                </div>
                <div class="word-stat">
                    <span class="stat-icon">👤</span> ${word.studentName}
                </div>
            </div>
            
            <div class="word-actions">
                <button class="btn-vote like-btn ${userVoteType === 'like' ? 'active' : ''}" 
                        onclick="voteWord('${word._id}', 'like')"
                        ${hasUserVoted && userVoteType === 'like' ? 'disabled' : ''}>
                    👍 Beğen
                </button>
                <button class="btn-vote dislike-btn ${userVoteType === 'dislike' ? 'active' : ''}" 
                        onclick="voteWord('${word._id}', 'dislike')"
                        ${hasUserVoted && userVoteType === 'dislike' ? 'disabled' : ''}>
                    👎 Beğenme
                </button>
                ${(!word.sentence || word.sentenceStatus === 'rejected') ? `
                <button class="btn-secondary" 
                        onclick="openSentenceModal('${word._id}')">
                    💬 Cümle Ekle
                </button>
                ` : ''}
            </div>
        </div>
        `;
    }).join('');
}

// Kelime arama
async function searchWords() {
    const searchTerm = document.getElementById('searchWordsInput').value;
    
    try {
        const response = await fetch(`${window.API_URL}/api/words/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        
        if (data.success) {
            allWords = data.words;
            renderWords();
        }
    } catch (error) {
        console.error('Arama hatası:', error);
    }
}

// Like/Dislike işlemi
async function voteWord(wordId, type) {
    try {
        const response = await fetch(`${window.API_URL}/api/words/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId, 
                type, 
                studentId: currentUser.studentId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.newPoints) {
                currentUser.points = data.newPoints;
                updatePointsDisplay();
            }
            
            // Kelime listesini güncelle
            await loadAllWords();
            
            // Başarı mesajı
            showTempMessage(data.message, 'success');
        } else {
            showTempMessage(data.message, 'error');
        }
    } catch (error) {
        console.error('Oy verme hatası:', error);
        showTempMessage('Oy verme hatası!', 'error');
    }
}

// Cümle ekleme modal'ını kapat
function closeSentenceModal() {
    document.getElementById('sentenceModal').classList.remove('active');
    currentEditingWordId = null;
}

// Dil bayrağı getir
function getLanguageFlag(language) {
    const flags = {
        'turkish': '🇹🇷',
        'english': '🇺🇸',
        'arabic': '🇸🇦'
    };
    return flags[language] || '🌐';
}

// Puan display'ini güncelle
function updatePointsDisplay() {
    const el1 = document.getElementById('profilePoints');
    if (el1) el1.textContent = currentUser.points;
    
    const el2 = document.getElementById('allWordsPoints');
    if (el2) el2.textContent = currentUser.points;
    
    const el3 = document.getElementById('profileMetaPoints');
    if (el3) el3.textContent = currentUser.points;
}

// Genel puan güncelleme fonksiyonu
function updatePoints() {
    updatePointsDisplay();
    
    const quizPoints = document.getElementById('quizPoints');
    if (quizPoints) quizPoints.textContent = currentUser.points;
    
    const matchingPoints = document.getElementById('matchingPoints');
    if (matchingPoints) matchingPoints.textContent = currentUser.points;
    
    const fillBlankPoints = document.getElementById('fillBlankPoints');
    if (fillBlankPoints) fillBlankPoints.textContent = currentUser.points;
}

// Mesaj göster fonksiyonu
function showMessage(elementId, type, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="message ${type}">${message}</div>`;
    }
}

// Geçici mesaj göster
function showTempMessage(message, type) {
    const tempDiv = document.createElement('div');
    tempDiv.className = `message ${type}`;
    tempDiv.textContent = message;
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '20px';
    tempDiv.style.left = '50%';
    tempDiv.style.transform = 'translateX(-50%)';
    tempDiv.style.zIndex = '1000';
    
    document.body.appendChild(tempDiv);
    
    setTimeout(() => {
        document.body.removeChild(tempDiv);
    }, 3000);
}

// Çıkış yap
function logout() {
    currentUser = null;
    allWords = [];
    currentEditingWordId = null;
    
    document.getElementById('loginForm').reset();
    document.getElementById('changePasswordForm').reset();
    document.getElementById('wordAddForm').reset();
    document.getElementById('sentenceForm').reset();
    
    document.getElementById('message').innerHTML = '';
    document.getElementById('passwordMessage').innerHTML = '';
    document.getElementById('wordMessage').innerHTML = '';
    document.getElementById('sentenceMessage').innerHTML = '';
    
    showPage('loginPage');
}

// EŞLEŞTIRME OYUNU
let matchingState = {
    words: [],
    matched: [],
    selectedWord: null,
    selectedMeaning: null,
    score: 0,
    timeLeft: 40,
    timerInterval: null
};

function showMatchingGame() {
    if (allWords.length === 0) {
        alert('❌ Henüz kelime eklenmemiş! Önce kelime ekleyin.');
        return;
    }
    let availableWords = allWords.filter(w => w.status === 'approved');
    if (availableWords.length === 0) {
        alert('❌ Onaylı kelime yok! Lütfen kelime ekleyin ve admin onayı bekleyin.');
        return;
    }
    if (availableWords.length < 2) {
        alert('❌ En az 2 kelime gerekli!');
        return;
    }
    
    openGameModeModal('matching');
}

function startGameSession(gameType, mode = 'solo', friendStudentId = null) {
    if (allWords.length === 0) {
        alert('❌ Henüz kelime eklenmemiş! Önce kelime ekleyin.');
        return;
    }
    let availableWords = allWords.filter(w => w.status === 'approved');
    if (availableWords.length === 0) {
        alert('❌ Onaylı kelime yok! Lütfen kelime ekleyin ve admin onayı bekleyin.');
        return;
    }
    if (availableWords.length < 2) {
        alert('❌ En az 2 kelime gerekli!');
        return;
    }
    
    // Limit to 10 words max, randomize selection
    availableWords = availableWords.sort(() => Math.random() - 0.5).slice(0, 5);
    
    matchingState.words = availableWords;
    matchingState.matched = [];
    matchingState.score = 0;
    matchingState.selectedWord = null;
    matchingState.selectedMeaning = null;
    matchingState.timeLeft = 60;
    
    // Clear any existing timer
    if (matchingState.timerInterval) {
        clearInterval(matchingState.timerInterval);
    }
    
    // Clear previous game message
    document.getElementById('matchingMessage').innerHTML = '';
    
    // Reset finish button
    const finishBtn = document.getElementById('matchingFinishBtn');
    if (finishBtn) {
        finishBtn.disabled = false;
        finishBtn.textContent = '✅ Bitir & Puanı Al';
    }
    
    initMatchingGame();
    startMatchingTimer();
    showPage('matchingPage');
}

function showMatchingTutorial() {
    const tutorialModal = document.getElementById('matchingTutorial');
    if (tutorialModal) {
        tutorialModal.classList.add('active');
        tutorialModal.addEventListener('click', function(e) {
            if (e.target === tutorialModal) {
                closeMatchingTutorial();
            }
        });
    }
}

function closeMatchingTutorial() {
    const tutorialModal = document.getElementById('matchingTutorial');
    if (tutorialModal) {
        tutorialModal.classList.remove('active');
    }
}

function startFromTutorial() {
    closeMatchingTutorial();
    showMatchingGame();
}

function initMatchingGame() {
    const words = [...matchingState.words];
    const meanings = [...matchingState.words].sort(() => Math.random() - 0.5);
    
    const board = document.getElementById('matchingBoard');
    board.innerHTML = `
        <div class="matching-section">
            <div class="matching-section-title">🇹🇷 Kelimeler</div>
            <div id="wordsSection"></div>
        </div>
        <div class="matching-section">
            <div class="matching-section-title">📖 Anlamlar</div>
            <div id="meaningsSection"></div>
        </div>
    `;
    
    const wordsSection = document.getElementById('wordsSection');
    const meaningsSection = document.getElementById('meaningsSection');
    
    words.forEach((word, index) => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'matching-item';
        wordDiv.textContent = word.word;
        wordDiv.dataset.wordId = word._id;
        wordDiv.onclick = () => selectWord(index);
        wordsSection.appendChild(wordDiv);
    });
    
    meanings.forEach((word, index) => {
        const meaningDiv = document.createElement('div');
        meaningDiv.className = 'matching-item';
        meaningDiv.textContent = word.meaning;
        meaningDiv.dataset.wordId = word._id;
        meaningDiv.onclick = () => selectMeaning(index);
        meaningsSection.appendChild(meaningDiv);
    });
    
    updateMatchingStats();
}

function selectWord(index) {
    const item = document.querySelectorAll('#wordsSection .matching-item')[index];
    if (item.classList.contains('matched')) return;
    
    document.querySelectorAll('#wordsSection .matching-item').forEach((elem, i) => {
        if (i === matchingState.selectedWord) elem.classList.remove('active');
    });
    
    if (matchingState.selectedWord === index) {
        matchingState.selectedWord = null;
    } else {
        matchingState.selectedWord = index;
        item.classList.add('active');
    }
    
    checkMatch();
}

function selectMeaning(index) {
    const item = document.querySelectorAll('#meaningsSection .matching-item')[index];
    if (item.classList.contains('matched')) return;
    
    document.querySelectorAll('#meaningsSection .matching-item').forEach((elem, i) => {
        if (i === matchingState.selectedMeaning) elem.classList.remove('active');
    });
    
    if (matchingState.selectedMeaning === index) {
        matchingState.selectedMeaning = null;
    } else {
        matchingState.selectedMeaning = index;
        item.classList.add('active');
    }
    
    checkMatch();
}

function checkMatch() {
    if (matchingState.selectedWord !== null && matchingState.selectedMeaning !== null) {
        const wordItem = document.querySelectorAll('#wordsSection .matching-item')[matchingState.selectedWord];
        const meaningItem = document.querySelectorAll('#meaningsSection .matching-item')[matchingState.selectedMeaning];
        
        const wordId = wordItem.dataset.wordId;
        const meaningId = meaningItem.dataset.wordId;
        
        if (wordId === meaningId) {
            matchingState.matched.push(wordId);
            // Update score: each correct match = matched count * 10
            matchingState.score = matchingState.matched.length * 10;
            
            wordItem.classList.add('matched');
            meaningItem.classList.add('matched');
            
            wordItem.classList.remove('active');
            meaningItem.classList.remove('active');
            
            matchingState.selectedWord = null;
            matchingState.selectedMeaning = null;
            
            updateMatchingStats();
        } else {
            wordItem.classList.add('incorrect');
            meaningItem.classList.add('incorrect');
            
            setTimeout(() => {
                wordItem.classList.remove('incorrect', 'active');
                meaningItem.classList.remove('incorrect', 'active');
                matchingState.selectedWord = null;
                matchingState.selectedMeaning = null;
            }, 300);
        }
    }
}

function updateMatchingStats() {
    document.getElementById('matchingMatched').textContent = matchingState.matched.length;
    document.getElementById('matchingRemaining').textContent = matchingState.words.length - matchingState.matched.length;
    document.getElementById('matchingScore').textContent = matchingState.score;
    document.getElementById('matchingTimer').textContent = matchingState.timeLeft;
    document.getElementById('matchingPoints').textContent = currentUser.points;
}

function startMatchingTimer() {
    if (matchingState.timerInterval) {
        clearInterval(matchingState.timerInterval);
    }
    
    const gameStats = document.querySelector('.game-stats');
    if (gameStats) {
        gameStats.classList.remove('timer-warning');
    }
    
    matchingState.timerInterval = setInterval(() => {
        matchingState.timeLeft--;
        updateMatchingStats();
        
        // Add warning style when time is low
        if (matchingState.timeLeft <= 10 && matchingState.timeLeft > 0) {
            if (gameStats && !gameStats.classList.contains('timer-warning')) {
                gameStats.classList.add('timer-warning');
            }
        }
        
        if (matchingState.timeLeft <= 0) {
            clearInterval(matchingState.timerInterval);
            if (gameStats) {
                gameStats.classList.remove('timer-warning');
            }
            endMatchingGame();
        }
    }, 1000);
}

async function endMatchingGame() {
    // Disable button immediately to prevent multiple clicks
    const finishBtn = document.getElementById('matchingFinishBtn');
    if (finishBtn) {
        finishBtn.disabled = true;
        finishBtn.textContent = '⏳ İşleniyor...';
    }
    
    // Calculate points based on matched words (each match = 10 points)
    const totalPoints = matchingState.matched.length * 10;
    
    // Disable board interaction
    document.querySelectorAll('#wordsSection .matching-item, #meaningsSection .matching-item').forEach(item => {
        item.style.pointerEvents = 'none';
    });
    
    if (totalPoints > 0) {
        showMessage('matchingMessage', 'success', 
            `🎉 🎉 ${matchingState.matched.length} kelime eşleştirdin! ${totalPoints} puan kazandın!`);
        currentUser.points += totalPoints;
        updatePoints();
        
        // Backend'e puan kaydet
        try {
            console.log('🔵 Puan kaydetme başladı:', { studentId: currentUser.studentId, totalPoints });
            const response = await fetch(`${window.API_URL}/api/words/save-game-points`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: currentUser.studentId,
                    points: totalPoints,
                    gameType: 'matching'
                })
            });
            console.log('🔵 Response status:', response.status);
            const data = await response.json();
            console.log('🔵 Backend response:', data);
            if (data.success && data.newPoints) { 
                console.log('✅ Puan başarıyla kaydedildi! Yeni puan:', data.newPoints);
                currentUser.points = data.newPoints; 
                updatePoints();
            } else {
                console.warn('⚠️ Backend success false veya newPoints yok:', data);
            }
        } catch (error) {
            console.error('❌ Puan kayıt hatası:', error);
        }
    } else {
        showMessage('matchingMessage', 'warning', 
            `⏱️ Puan kazanamadın. Daha fazla kelime eşleştirmeye çalış!`);
    }
    
    // 3 saniye sonra profil sayfasına dön
    setTimeout(() => {
        showProfilePage();
    }, 3000);
}

function resetMatching() {
    // Clear existing timer
    if (matchingState.timerInterval) {
        clearInterval(matchingState.timerInterval);
    }
    
    matchingState.matched = [];
    matchingState.score = 0;
    matchingState.selectedWord = null;
    matchingState.selectedMeaning = null;
    matchingState.timeLeft = 60;
    
    // Clear any messages
    const msgElement = document.getElementById('matchingMessage');
    if (msgElement) {
        msgElement.innerHTML = '';
    }
    
    // Reset finish button
    const finishBtn = document.getElementById('matchingFinishBtn');
    if (finishBtn) {
        finishBtn.disabled = false;
        finishBtn.textContent = '✅ Bitir & Puanı Al';
    }
    
    // Re-randomize the words
    let availableWords = matchingState.words.slice();
    matchingState.words = availableWords.sort(() => Math.random() - 0.5);
    
    initMatchingGame();
    startMatchingTimer();
}

// QUIZ OYUNU
let quizState = {
    words: [],
    currentQuestionIndex: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    score: 0,
    answered: false
};

function showQuizGame() {
    if (allWords.length === 0) {
        alert('❌ Henüz kelime eklenmemiş! Önce kelime ekleyin.');
        return;
    }
    let availableWords = allWords.filter(w => w.status === 'approved');
    if (availableWords.length === 0) {
        alert('❌ Onaylı kelime yok! Lütfen kelime ekleyin ve admin onayı bekleyin.');
        return;
    }
    if (availableWords.length < 4) {
        alert('❌ En az 4 kelime gerekli!');
        return;
    }
    
    // Select up to 10 words randomly
    quizState.words = availableWords.sort(() => Math.random() - 0.5).slice(0, 10);
    quizState.currentQuestionIndex = 0;
    quizState.correctAnswers = 0;
    quizState.wrongAnswers = 0;
    quizState.score = 0;
    quizState.answered = false;
    
    initQuizGame();
    showPage('quizPage');
}

function initQuizGame() {
    displayQuizQuestion();
    updateQuizStats();
}

function displayQuizQuestion() {
    const question = quizState.words[quizState.currentQuestionIndex];
    
    // Create options: correct answer + 3 random wrong answers
    const options = [question.meaning];
    const allWords = quizState.words.filter((w, i) => i !== quizState.currentQuestionIndex);
    
    // Get 3 random wrong answers
    for (let i = 0; i < 3 && allWords.length > 0; i++) {
        const randomIdx = Math.floor(Math.random() * allWords.length);
        options.push(allWords[randomIdx].meaning);
        allWords.splice(randomIdx, 1);
    }
    
    // Shuffle options
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    
    // Display question and options
    document.getElementById('quizQuestionText').textContent = question.word;
    document.querySelectorAll('.quiz-option').forEach((btn, idx) => {
        btn.classList.remove('correct', 'incorrect');
        btn.disabled = false;
        document.getElementById('quizOptionText' + idx).textContent = shuffledOptions[idx];
        btn.dataset.correct = shuffledOptions[idx] === question.meaning;
    });
    
    quizState.answered = false;
    updateQuizStats();
}

function answerQuiz(optionIndex) {
    if (quizState.answered) return;
    
    quizState.answered = true;
    const selectedBtn = document.getElementById('quizOption' + optionIndex);
    const isCorrect = selectedBtn.dataset.correct === 'true';
    
    // Disable all buttons
    document.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);
    
    // Show result
    if (isCorrect) {
        quizState.correctAnswers++;
        quizState.score += 5;
        selectedBtn.classList.add('correct');
        showMessage('quizMessage', 'success', '✅ Doğru! +5 puan');
    } else {
        quizState.wrongAnswers++;
        selectedBtn.classList.add('incorrect');
        // Show correct answer
        document.querySelectorAll('.quiz-option').forEach(btn => {
            if (btn.dataset.correct === 'true') {
                btn.classList.add('correct');
            }
        });
        showMessage('quizMessage', 'error', '❌ Yanlış!');
    }
    
    updateQuizStats();
    
    // Move to next question after 1.5 seconds
    setTimeout(() => {
        if (quizState.currentQuestionIndex < quizState.words.length - 1) {
            quizState.currentQuestionIndex++;
            displayQuizQuestion();
        } else {
            endQuizGame();
        }
    }, 1500);
}

async function endQuizGame() {
    document.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);
    
    const message = `🎉 Quiz Tamamlandı!\n✅ Doğru: ${quizState.correctAnswers}\n❌ Yanlış: ${quizState.wrongAnswers}\n🏆 Toplam Puan: ${quizState.score}`;
    showMessage('quizMessage', 'success', message);
    
    currentUser.points += quizState.score;
    updatePoints();
    
    // Backend'e puan kaydet
    if (quizState.score > 0) {
        try {
            console.log('🔵 Quiz puan kaydetme başladı:', { studentId: currentUser.studentId, points: quizState.score });
            const response = await fetch(`${window.API_URL}/api/words/save-game-points`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: currentUser.studentId,
                    points: quizState.score,
                    gameType: 'quiz'
                })
            });
            console.log('🔵 Quiz response status:', response.status);
            const data = await response.json();
            console.log('🔵 Quiz backend response:', data);
            if (data.success && data.newPoints) { 
                console.log('✅ Quiz puan başarıyla kaydedildi! Yeni puan:', data.newPoints);
                currentUser.points = data.newPoints; 
                updatePoints(); 
            } else {
                console.warn('⚠️ Quiz: Backend success false veya newPoints yok:', data);
            }
        } catch (error) {
            console.error('❌ Quiz puan kayıt hatası:', error);
        }
    }
}

function resetQuiz() {
    showQuizGame();
}

function updateQuizStats() {
    document.getElementById('quizPoints').textContent = currentUser.points;
    document.getElementById('quizCorrect').textContent = quizState.correctAnswers;
    document.getElementById('quizWrong').textContent = quizState.wrongAnswers;
    document.getElementById('quizScore').textContent = quizState.score;
    document.getElementById('quizQuestionNum').textContent = (quizState.currentQuestionIndex + 1) + '/' + quizState.words.length;
}

// Login sayfası istatistikleri güncelle
function updateLoginStats() {
    // Saat ve tarih güncelle
    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('tr-TR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById('currentTime').textContent = timeStr;
    document.getElementById('currentDate').textContent = dateStr;
    
    // Backend'den istatistikleri çek
    loadLoginPageStats();
}

async function loadLoginPageStats() {
    // Check if elements exist (not in React app)
    const totalMembersEl = document.getElementById('totalMembers');
    const totalWordsEl = document.getElementById('totalWords');
    const activeStudentsEl = document.getElementById('activeStudents');
    
    // If elements don't exist, we're in React app, skip stats loading
    if (!totalMembersEl || !totalWordsEl || !activeStudentsEl) {
        return;
    }
    
    try {
        const response = await fetch(`${window.API_URL}/api/stats/platform`);
        if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
                totalMembersEl.textContent = data.totalMembers || 0;
                totalWordsEl.textContent = data.totalWords || 0;
                activeStudentsEl.textContent = data.activeStudents || 1;
                console.log('Backend stats loaded:', data);
                return;
            }
        }
    } catch (error) {
        console.error('Stats yükleme hatası:', error);
    }
    
    // Fallback: local veriler
    const memberCount = allWords.length > 0 ? 15 : 0;
    const wordCount = allWords.length || 25;
    
    totalMembersEl.textContent = memberCount;
    totalWordsEl.textContent = wordCount;
    activeStudentsEl.textContent = '8';
    
    console.log('Fallback stats used:', { memberCount, wordCount });
}

// BOŞLUK DOLDURMA OYUNU
let fillBlankState = {
    words: [],
    currentQuestionIndex: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    score: 0,
    answered: false,
    currentAnswer: null,
    currentCorrectAnswer: null
};

function showFillBlankGame() {
    if (allWords.length === 0) {
        alert('❌ Henüz kelime eklenmemiş! Önce kelime ekleyin.');
        return;
    }
    let availableWords = allWords.filter(w => w.status === 'approved');
    if (availableWords.length === 0) {
        alert('❌ Onaylı kelime yok! Lütfen kelime ekleyin ve admin onayı bekleyin.');
        return;
    }
    if (availableWords.length < 2) {
        alert('❌ En az 2 kelime gerekli!');
        return;
    }

    fillBlankState.words = availableWords.slice(0, 10);
    fillBlankState.currentQuestionIndex = 0;
    fillBlankState.correctAnswers = 0;
    fillBlankState.wrongAnswers = 0;
    fillBlankState.score = 0;
    fillBlankState.answered = false;

    document.getElementById('fillBlankPoints').textContent = currentUser.points;
    document.getElementById('fillBlankCorrect').textContent = 0;
    document.getElementById('fillBlankWrong').textContent = 0;
    document.getElementById('fillBlankScore').textContent = 0;
    document.getElementById('fillBlankQuestionNum').textContent = '1/' + fillBlankState.words.length;

    showPage('fillBlankPage');
    displayFillBlankQuestion();
}

function createBlankQuestion(text, correctAnswer) {
    const words = text.split(' ');
    const randomIndex = Math.floor(Math.random() * words.length);
    const blankWord = words[randomIndex];
    
    words[randomIndex] = '___________';
    const questionText = words.join(' ');
    
    return {
        text: questionText,
        correctAnswer: blankWord,
        fullText: text
    };
}

function displayFillBlankQuestion() {
    if (fillBlankState.currentQuestionIndex >= fillBlankState.words.length) {
        finishFillBlank();
        return;
    }

    const word = fillBlankState.words[fillBlankState.currentQuestionIndex];
    
    const isWordQuestion = Math.random() > 0.5 && word.sentence;
    let question;
    
    if (isWordQuestion) {
        question = createBlankQuestion(word.sentence, word.word);
        fillBlankState.questionType = 'sentence';
    } else {
        question = createBlankQuestion(word.meaning, word.word);
        fillBlankState.questionType = 'meaning';
    }

    fillBlankState.currentCorrectAnswer = question.correctAnswer.toLowerCase().trim();
    
    const currentQ = fillBlankState.currentQuestionIndex + 1;
    const totalQ = fillBlankState.words.length;
    const progressPercent = (currentQ / totalQ) * 100;
    
    document.getElementById('fillBlankQuestionNum').textContent = `${currentQ}/${totalQ}`;
    document.getElementById('fillBlankProgressFill').style.width = progressPercent + '%';
    
    document.getElementById('fillBlankWordHeader').textContent = `📌 Kelime: ${word.word}`;
    
    document.getElementById('fillBlankQuestionType').textContent = 
        isWordQuestion ? '📖 Cümle' : '📚 Anlam';
    
    document.getElementById('fillBlankQuestionText').textContent = question.text;

    const wrongAnswers = fillBlankState.words
        .filter(w => w.word !== word.word)
        .map(w => w.word)
        .slice(0, 3);
    
    const choices = [question.correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    
    choices.forEach((choice, index) => {
        const btn = document.getElementById('fillBlankChoice' + index);
        btn.textContent = choice;
        btn.disabled = false;
        btn.classList.remove('selected', 'correct', 'incorrect');
    });

    document.getElementById('fillBlankAnswer').value = '';
    document.getElementById('fillBlankAnswer').disabled = false;
    document.getElementById('fillBlankAnswer').classList.remove('correct', 'incorrect');
    document.getElementById('fillBlankFeedback').innerHTML = '';
    document.getElementById('fillBlankFeedback').classList.remove('correct', 'incorrect');
    
    document.getElementById('fillBlankSubmitBtn').style.display = 'inline-block';
    document.getElementById('fillBlankNextBtn').style.display = 'none';
    document.getElementById('fillBlankFinishBtn').style.display = 'none';
    
    fillBlankState.answered = false;
}

function selectFillBlankAnswer(answer) {
    if (fillBlankState.answered) return;
    
    document.getElementById('fillBlankAnswer').value = answer;
    fillBlankState.currentAnswer = answer;
}

function submitFillBlank() {
    if (fillBlankState.answered) return;
    
    const userAnswer = (document.getElementById('fillBlankAnswer').value || '').toLowerCase().trim();
    
    if (!userAnswer) {
        alert('❌ Lütfen bir cevap yazın veya seçin!');
        return;
    }

    fillBlankState.answered = true;
    
    const isCorrect = userAnswer === fillBlankState.currentCorrectAnswer;
    const feedbackEl = document.getElementById('fillBlankFeedback');
    const answerInputEl = document.getElementById('fillBlankAnswer');
    
    if (isCorrect) {
        fillBlankState.correctAnswers++;
        fillBlankState.score += 10;
        answerInputEl.classList.add('correct');
        feedbackEl.classList.add('correct');
        feedbackEl.innerHTML = '✅ Doğru cevap! +10 puan kazandın!';
    } else {
        fillBlankState.wrongAnswers++;
        answerInputEl.classList.add('incorrect');
        feedbackEl.classList.add('incorrect');
        feedbackEl.innerHTML = `❌ Yanlış cevap. Doğru cevap: <strong>${fillBlankState.currentCorrectAnswer}</strong>`;
    }
    
    document.querySelectorAll('.fillblank-option-btn').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent.toLowerCase().trim() === fillBlankState.currentCorrectAnswer) {
            btn.classList.add('correct');
        } else if (btn.textContent.toLowerCase().trim() === userAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    updateFillBlankStats();
    
    document.getElementById('fillBlankSubmitBtn').style.display = 'none';
    answerInputEl.disabled = true;
    
    if (fillBlankState.currentQuestionIndex < fillBlankState.words.length - 1) {
        document.getElementById('fillBlankNextBtn').style.display = 'inline-block';
    } else {
        document.getElementById('fillBlankFinishBtn').style.display = 'inline-block';
    }
}

function nextFillBlank() {
    fillBlankState.currentQuestionIndex++;
    displayFillBlankQuestion();
}

async function finishFillBlank() {
    const accuracy = Math.round((fillBlankState.correctAnswers / fillBlankState.words.length) * 100);
    const resultMessage = `
        <div style="text-align: center;">
            <h2 style="font-size: 28px; margin: 0 0 15px 0;">🎉 Oyun Tamamlandı!</h2>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Doğru</div>
                        <div style="font-size: 24px; font-weight: bold; color: #10b981;">${fillBlankState.correctAnswers}</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Yanlış</div>
                        <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${fillBlankState.wrongAnswers}</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Başarı</div>
                        <div style="font-size: 24px; font-weight: bold; color: #6366f1;">${accuracy}%</div>
                    </div>
                </div>
                <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                    🏆 +${fillBlankState.score} Puan Kazandın!
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('fillBlankFeedback').innerHTML = resultMessage;
    document.getElementById('fillBlankFeedback').classList.add('correct');
    
    document.getElementById('fillBlankSubmitBtn').style.display = 'none';
    document.getElementById('fillBlankNextBtn').style.display = 'none';
    document.getElementById('fillBlankFinishBtn').style.display = 'none';
    document.getElementById('fillBlankAnswer').disabled = true;
    document.querySelectorAll('.fillblank-option-btn').forEach(btn => btn.disabled = true);
    
    currentUser.points += fillBlankState.score;
    updateFillBlankStats();
    
    if (fillBlankState.score > 0) {
        try {
            console.log('🔵 FillBlank puan kaydetme başladı:', { studentId: currentUser.studentId, points: fillBlankState.score });
            const response = await fetch(`${window.API_URL}/api/words/save-game-points`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: currentUser.studentId,
                    points: fillBlankState.score,
                    gameType: 'fillblank'
                })
            });
            console.log('🔵 FillBlank response status:', response.status);
            const data = await response.json();
            console.log('🔵 FillBlank backend response:', data);
            if (data.success && data.newPoints) { 
                console.log('✅ FillBlank puan başarıyla kaydedildi! Yeni puan:', data.newPoints);
                currentUser.points = data.newPoints; 
                updatePoints(); 
            } else {
                console.warn('⚠️ FillBlank: Backend success false veya newPoints yok:', data);
            }
        } catch (error) {
            console.error('❌ FillBlank puan kayıt hatası:', error);
        }
    }
    
    setTimeout(() => {
        showProfilePage();
    }, 4000);
}

function updateFillBlankStats() {
    document.getElementById('fillBlankPoints').textContent = currentUser.points;
    document.getElementById('fillBlankCorrect').textContent = fillBlankState.correctAnswers;
    document.getElementById('fillBlankWrong').textContent = fillBlankState.wrongAnswers;
    document.getElementById('fillBlankScore').textContent = fillBlankState.score;
    document.getElementById('fillBlankQuestionNum').textContent = (fillBlankState.currentQuestionIndex + 1) + '/' + fillBlankState.words.length;
}

// Sayfa yüklendiğinde login ekranını göster
document.addEventListener('DOMContentLoaded', async function() {
    showPage('loginPage');
    
    // Kelimeleri yükle
    await loadAllWords();
    
    // Login sayfasında istatistikleri güncelle
    await loadLoginPageStats();
    
    // Check if we're in vanilla JS app (not React)
    if (document.getElementById('currentTime')) {
        console.log('Stats yüklendi:', {
            totalMembers: document.getElementById('totalMembers')?.textContent,
            totalWords: document.getElementById('totalWords')?.textContent,
            activeStudents: document.getElementById('activeStudents')?.textContent,
            currentTime: document.getElementById('currentTime')?.textContent
        });
        
        // Her saniye saati güncelle
        setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const currentTimeEl = document.getElementById('currentTime');
            if (currentTimeEl) {
                currentTimeEl.textContent = timeStr;
            }
        }, 1000);
    }

    // Bildirim sayısı güncelle
    loadUserNotificationCount();
    
    // Bildirimleri 3 saniyede bir kontrol et
    setInterval(() => {
        if (currentUser) {
            loadUserNotificationCount();
        }
    }, 3000);
});

// ============ FEEDBACK SİSTEMİ ============

function openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.getElementById('feedbackForm').reset();
}

function showProfileInfoPage() {
    if (currentUser) {
        const avatar = currentUser.avatar || '😊';
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileClass').textContent = currentUser.class;
        document.getElementById('profileStudentId').textContent = currentUser.studentId;
        document.getElementById('profileTotalPoints').textContent = currentUser.points;
        document.getElementById('profileAvatarDisplay').textContent = avatar;
        document.getElementById('headerProfileBtn').textContent = avatar;
        
        if (currentUser.badge) {
            renderBadges(currentUser.badge, currentUser.nextBadge);
        }
        
        renderDailyStreak(currentUser.dailyStreak || 0, currentUser.streakBonusPoints || 0);
        
        document.getElementById('profileWordsCount').textContent = '...';
        document.getElementById('profileGamesCount').textContent = '...';
        document.getElementById('aiSuggestionsList').innerHTML = '<div class="suggestion-item loading"><span class="loading-text">🤖 Öneriler oluşturuluyor...</span></div>';
        
        showPage('profileInfoPage');
        
        loadProfileStatsAndSuggestions();
    }
}

async function loadProfileStatsAndSuggestions() {
    if (!currentUser) return;
    
    try {
        const [statsResponse, suggestionsResponse] = await Promise.all([
            fetch(`${window.API_URL}/api/words/student-stats/${currentUser.studentId}`),
            fetch(`${window.API_URL}/api/words/ai-suggestions/${currentUser.studentId}`)
        ]);

        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            if (statsData.success && statsData.stats) {
                document.getElementById('profileWordsCount').textContent = statsData.stats.approvedWords || '0';
                document.getElementById('profileGamesCount').textContent = statsData.stats.gamesPlayed || '0';
                document.getElementById('profileRank').textContent = statsData.stats.rank || '-';
                
                if (statsData.stats.badge || statsData.stats.nextBadge) {
                    renderBadges(statsData.stats.badge, statsData.stats.nextBadge);
                }
            }
        }

        if (suggestionsResponse.ok) {
            const sugData = await suggestionsResponse.json();
            if (sugData.success && sugData.suggestions && Array.isArray(sugData.suggestions)) {
                renderSuggestions(sugData.suggestions);
            } else {
                renderSuggestions(getDefaultSuggestions(0, 0));
            }
        } else {
            renderSuggestions(getDefaultSuggestions(0, 0));
        }
    } catch (error) {
        console.error('Profil verisi yüklenirken hata:', error);
        document.getElementById('profileWordsCount').textContent = '0';
        document.getElementById('profileGamesCount').textContent = '0';
        renderSuggestions(getDefaultSuggestions(0, 0));
    }
}

function getDefaultSuggestions(words, games) {
    const suggestions = [];
    if (words === 0) {
        suggestions.push({
            icon: '📚',
            title: 'Kelime Ekle',
            description: 'Henüz kelime eklemedin. İlk kelimelerini ekle ve öğrenmeye başla!',
            type: 'warning'
        });
    }
    if (games === 0 && words > 0) {
        suggestions.push({
            icon: '🎮',
            title: 'Oyun Oyna',
            description: 'Kelimelerini pekiştir. Oyunları deneyerek daha iyi öğrenebilirsin!',
            type: 'warning'
        });
    }
    if (words > 0 && games > 0) {
        suggestions.push({
            icon: '✨',
            title: 'Harika İlerleme',
            description: 'Düzenli çalışmaya devam et. Başarıya ulaşmak için seni bekliyoruz!',
            type: 'success'
        });
    }
    if (suggestions.length === 0) {
        suggestions.push({
            icon: '🚀',
            title: 'Başla',
            description: 'İlk adımını at. Kelime ekleyerek öğrenme yolculuğuna başla!',
            type: 'info'
        });
    }
    return suggestions;
}

function renderSuggestions(suggestions) {
    const list = document.getElementById('aiSuggestionsList');
    if (!list) return;
    
    if (!suggestions || suggestions.length === 0) {
        list.innerHTML = '<div class="suggestion-item info"><span class="loading-text">Hiç önerimiz yok, harika gidiyorsun!</span></div>';
        return;
    }
    
    list.innerHTML = suggestions.map((suggestion, index) => {
        const actionText = {
            'kelimeEkle': 'Kelime Ekle',
            'oyunlar': 'Oyunları Aç',
            'devamEt': 'Devam Et',
            'profilDüzenle': 'Düzenle'
        }[suggestion.action] || 'Detayları Gör';
        
        return `
        <div class="suggestion-item ${suggestion.type || 'info'}" onclick="handleSuggestionClick('${suggestion.action || ''}')">
            <div class="suggestion-icon">${suggestion.icon || '💡'}</div>
            <div class="suggestion-content">
                <div class="suggestion-title">${suggestion.title || 'Başlık'}</div>
                <div class="suggestion-description">${suggestion.description || 'Açıklama'}</div>
                <div class="suggestion-action">${actionText} →</div>
            </div>
        </div>
    `}).join('');
}

function handleSuggestionClick(action) {
    switch(action) {
        case 'kelimeEkle':
            showProfilePage();
            setTimeout(() => switchProfileTab('words'), 300);
            break;
        case 'oyunlar':
            showProfilePage();
            setTimeout(() => switchProfileTab('games'), 300);
            break;
        case 'devamEt':
            showProfilePage();
            break;
        case 'profilDüzenle':
            break;
        default:
            showProfilePage();
    }
}

async function sendFeedback(event) {
    event.preventDefault();

    const feedbackType = document.getElementById('feedbackType').value;
    const feedbackMessage = document.getElementById('feedbackMessage').value;

    if (!currentUser) {
        showMessage('feedbackStatusMessage', 'error', 'Lütfen sisteme giriş yapın');
        return;
    }

    try {
        const payload = {
            studentId: currentUser.studentId,
            studentName: currentUser.name,
            studentClass: currentUser.class,
            message: feedbackMessage,
            type: feedbackType
        };

        console.log('Feedback payload:', payload);

        const response = await fetch(`${window.API_URL}/api/feedback/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);

        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            showMessage('feedbackStatusMessage', 'success', data.message);
            document.getElementById('feedbackForm').reset();
            setTimeout(() => {
                closeFeedbackModal();
            }, 1500);
        } else {
            showMessage('feedbackStatusMessage', 'error', data.message || 'Hata oluştu');
        }
    } catch (error) {
        console.error('Feedback gönderme hatası:', error);
        showMessage('feedbackStatusMessage', 'error', 'Bağlantı hatası: ' + error.message);
    }
}

function openNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    if (modal) {
        modal.classList.add('active');
    }
    loadUserNotifications();
}

function closeNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function loadUserNotifications() {
    try {
        if (!currentUser || !currentUser._id) {
            document.getElementById('notificationsList').innerHTML = '<p class="empty-state">Lütfen giriş yapın</p>';
            return;
        }

        const [feedbackRes, notificationRes] = await Promise.all([
            fetch(`${window.API_URL}/api/feedback/my-feedbacks/${currentUser.studentId}`),
            fetch(`${window.API_URL}/api/notifications/${currentUser._id}`)
        ]);

        const feedbackData = await feedbackRes.json();
        const notificationData = await notificationRes.json();

        const notificationsList = document.getElementById('notificationsList');
        let allNotifications = [];

        // Feedbacks
        if (feedbackData.success) {
            const answeredFeedbacks = feedbackData.feedbacks.filter(f => f.adminReply && !f.studentRead);
            allNotifications = [...allNotifications, ...answeredFeedbacks.map(f => ({
                type: 'feedback',
                data: f,
                createdAt: f.adminReply.repliedAt
            }))];
        }

        // Game Notifications
        if (notificationData.success) {
            const gameNotifs = notificationData.notifications.filter(n => !n.isRead);
            console.log('📬 Yüklenen game notifications:', gameNotifs);
            gameNotifs.forEach(n => {
                console.log('📬 Notification detay:', { 
                    type: n.type, 
                    relatedGameInvitationId: n.relatedGameInvitationId,
                    relatedGameSessionId: n.relatedGameSessionId 
                });
            });
            
            allNotifications = [...allNotifications, ...gameNotifs.map(n => ({
                type: 'notification',
                data: n,
                createdAt: n.createdAt
            }))];
        }

        // Sort by date
        allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (allNotifications.length === 0) {
            notificationsList.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><h3>Yeni bildirim yok!</h3></div>';
            return;
        }

        notificationsList.innerHTML = allNotifications.map(item => {
            if (item.type === 'feedback') {
                const feedback = item.data;
                return `
                <div class="notification-item unread">
                    <div class="notification-header">
                        <div class="notification-title">💬 Geri Bildirim Cevabı</div>
                        <div class="notification-meta">${new Date(feedback.adminReply.repliedAt).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <div class="notification-message"><strong>Sizin Mesajınız:</strong> ${feedback.message}</div>
                    <div class="notification-admin">
                        <div class="admin-reply-label">👨‍💼 Yetkili Cevabı:</div>
                        <div class="admin-reply-text">${feedback.adminReply.message}</div>
                        <button class="btn-primary" style="margin-top: 12px; width: 100%;" onclick="markFeedbackAsRead('${feedback._id}')">Okundu</button>
                    </div>
                </div>`;
            } else {
                const notif = item.data;
                let actionButtons = '';
                
                if (notif.type === 'game_invite') {
                    actionButtons = `
                        <div class="notification-actions" style="display: flex; gap: 10px; margin-top: 10px;">
                            <button class="btn-primary" style="flex: 1;" onclick="acceptGameInvite('${notif.relatedGameInvitationId}', '${notif._id}')">Kabul Et</button>
                            <button class="btn-secondary" style="flex: 1;" onclick="rejectGameInvite('${notif.relatedGameInvitationId}', '${notif._id}')">Reddet</button>
                        </div>
                    `;
                } else if (notif.type === 'game_accepted') {
                    actionButtons = `
                        <div class="notification-actions" style="display: flex; gap: 10px; margin-top: 10px;">
                            <button class="btn-primary" style="flex: 1;" onclick="startMultiplayerGame('${notif.relatedGameSessionId}')">Oyuna Gir</button>
                            <button class="btn-secondary" style="flex: 1;" onclick="markNotificationAsRead('${notif._id}')">Kapat</button>
                        </div>
                    `;
                } else {
                    actionButtons = `<button class="btn-primary" style="margin-top: 12px; width: 100%;" onclick="markNotificationAsRead('${notif._id}')">Okundu</button>`;
                }

                return `
                <div class="notification-item unread">
                    <div class="notification-header">
                        <div class="notification-title">${notif.title}</div>
                        <div class="notification-meta">${new Date(notif.createdAt).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <div class="notification-message">${notif.message}</div>
                    ${actionButtons}
                </div>`;
            }
        }).join('');

    } catch (error) {
        console.error('Bildirim yükleme hatası:', error);
    }
}

async function loadUserNotificationCount() {
    try {
        if (!currentUser || !currentUser._id) {
            return;
        }

        const [feedbackRes, notificationRes] = await Promise.all([
            fetch(`${window.API_URL}/api/feedback/my-feedbacks/${currentUser.studentId}`),
            fetch(`${window.API_URL}/api/notifications/${currentUser._id}`)
        ]);

        const feedbackData = await feedbackRes.json();
        const notificationData = await notificationRes.json();

        let totalUnread = 0;

        if (feedbackData.success) {
            totalUnread += (feedbackData.unreadCount || 0);
        }

        if (notificationData.success) {
            totalUnread += (notificationData.unreadCount || 0);
        }

        const badge = document.getElementById('notificationBadge');

        if (totalUnread > 0) {
            badge.textContent = totalUnread;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Bildirim sayısı yükleme hatası:', error);
    }
}

async function markFeedbackAsRead(feedbackId) {
    try {
        const response = await fetch(`${window.API_URL}/api/feedback/mark-read/${feedbackId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            loadUserNotifications();
            loadUserNotificationCount();
        }
    } catch (error) {
        console.error('Bildirim işaretleme hatası:', error);
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`${window.API_URL}/api/notifications/mark-read/${notificationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            loadUserNotifications();
            loadUserNotificationCount();
        }
    } catch (error) {
        console.error('Bildirim işaretleme hatası:', error);
    }
}

async function acceptGameInvite(invitationId, notificationId) {
    try {
        console.log('📞 Davet kabul işlemi başlatılıyor - invitationId:', invitationId, 'notificationId:', notificationId);
        
        if (!invitationId || invitationId === 'undefined') {
            console.error('❌ invitationId undefined veya hatalı!');
            alert('❌ Davet ID bulunamadı. Sayfayı yenile ve tekrar dene.');
            return;
        }
        
        const url = `${window.API_URL}/api/games/invitation/${invitationId}/accept`;
        console.log('📞 API URL:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                acceptedByStudentId: currentUser.studentId
            })
        });

        const data = await response.json();
        console.log('📞 Backend yanıtı:', { statusOk: response.ok, data });

        if (response.ok && data.gameSessionId) {
            console.log('✅ Davet kabul edildi, GameSessionId:', data.gameSessionId);
            
            await markNotificationAsRead(notificationId);
            closeNotificationsModal();
            
            window.gameSessionId = data.gameSessionId;
            window.currentGameSession = data.gameSession;
            window.currentGameSessionWords = [];
            multiplayerState.sessionId = data.gameSessionId;
            
            console.log('✅ State ayarlandı:', { 
                windowSessionId: window.gameSessionId,
                multiplayerSessionId: multiplayerState.sessionId 
            });
            
            if (invitationAcceptanceCheckInterval) {
                clearInterval(invitationAcceptanceCheckInterval);
            }
            
            switchPage('multiplayerPage');
            showCountdown();
        } else {
            const errorMsg = data.message || (response.ok ? 'GameSessionId yok' : 'Davet kabul edilemedi');
            console.error('❌ Davet kabul hatası:', { response: response.status, data });
            alert(`❌ ${errorMsg}`);
        }
    } catch (error) {
        console.error('Davet kabul hatası:', error);
        alert('❌ Bir hata oluştu');
    }
}

async function rejectGameInvite(invitationId, notificationId) {
    try {
        const response = await fetch(`${window.API_URL}/api/games/invitation/${invitationId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rejectedByStudentId: currentUser.studentId
            })
        });

        const data = await response.json();

        if (response.ok) {
            await markNotificationAsRead(notificationId);
            loadUserNotifications();
            loadUserNotificationCount();
        } else {
            alert(`❌ ${data.message || 'İşlem başarısız'}`);
        }
    } catch (error) {
        console.error('Davet reddetme hatası:', error);
    }
}

// ============ ADMİN FEEDBACK YÖNETİMİ ============

async function loadAdminFeedbacks() {
    try {
        const statusFilter = document.getElementById('feedbackStatusFilter').value;
        const url = `${window.API_URL}/api/feedback/admin/all?status=${statusFilter}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            const list = document.getElementById('adminFeedbacksList');

            if (data.feedbacks.length === 0) {
                list.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><h3>Geri bildirim yok</h3></div>';
                return;
            }

            const typeIcons = {
                suggestion: '💡',
                bug: '🐛',
                complaint: '😞',
                praise: '👏'
            };

            const typeLabels = {
                suggestion: 'Öneri',
                bug: 'Hata',
                complaint: 'Şikayet',
                praise: 'Övgü'
            };

            list.innerHTML = data.feedbacks.map(feedback => `
                <div class="admin-feedback-item">
                    <div class="admin-feedback-header">
                        <div>
                            <div class="admin-feedback-title">${feedback.studentName} (${feedback.studentClass})</div>
                            <div class="admin-feedback-meta">📝 ${new Date(feedback.createdAt).toLocaleDateString('tr-TR')} • ${feedback.studentId}</div>
                        </div>
                        <div class="admin-feedback-type">${typeIcons[feedback.type]} ${typeLabels[feedback.type]}</div>
                    </div>

                    <div class="admin-feedback-message">${feedback.message}</div>

                    ${feedback.adminReply ? `
                        <div style="background: rgba(102, 126, 234, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                            <div class="admin-reply-label">✅ Yetkili Cevabı (${new Date(feedback.adminReply.repliedAt).toLocaleDateString('tr-TR')})</div>
                            <div class="admin-reply-text">${feedback.adminReply.message}</div>
                        </div>
                    ` : ''}

                    <div class="admin-feedback-actions">
                        ${!feedback.adminReply ? `
                            <button class="btn-reply" onclick="showReplyForm('${feedback._id}')">Cevap Ver</button>
                        ` : ''}
                        <button class="btn-close-feedback" onclick="closeFeedback('${feedback._id}')">Sil</button>
                    </div>

                    <div id="replyForm_${feedback._id}" style="display: none; margin-top: 12px;">
                        <form class="reply-form" onsubmit="submitAdminReply('${feedback._id}', event)">
                            <textarea class="reply-textarea" placeholder="Cevabınızı yazın..." required></textarea>
                            <button type="submit" class="btn-primary">Cevabı Gönder</button>
                        </form>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Feedback yükleme hatası:', error);
    }
}

function showReplyForm(feedbackId) {
    const form = document.getElementById(`replyForm_${feedbackId}`);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

async function submitAdminReply(feedbackId, event) {
    event.preventDefault();

    const form = event.target;
    const message = form.querySelector('textarea').value;

    try {
        const response = await fetch(`${window.API_URL}/api/feedback/admin/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                feedbackId,
                adminId: currentUser.id,
                adminName: currentUser.name,
                message
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Cevap başarıyla gönderildi!');
            loadAdminFeedbacks();
        } else {
            alert('❌ Hata: ' + data.message);
        }
    } catch (error) {
        console.error('Cevap gönderme hatası:', error);
        alert('Cevap gönderilemedi');
    }
}

async function closeFeedback(feedbackId) {
    try {
        const response = await fetch(`${window.API_URL}/api/feedback/admin/delete/${feedbackId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            loadAdminFeedbacks();
        }
    } catch (error) {
        console.error('Feedback silme hatası:', error);
    }
}

// ===================== AI CHAT MODAL FONKSİYONLARI =====================
async function openChatModal() {
    const modal = document.getElementById('chatModal');
    if (modal) {
        modal.classList.add('active');
        await loadChatHistory();
    }
}

async function loadChatHistory() {
    try {
        const response = await fetch(`${window.API_URL}/api/chat/history/${currentUser.studentId}`);
        const data = await response.json();
        
        if (data.success && data.messages.length > 0) {
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '<div class="chat-message bot-message"><div class="message-content">Merhaba! 👋 Ben AI asistanınız. Size nasıl yardımcı olabilirim?</div></div>';
            
            data.messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `chat-message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`;
                messageDiv.innerHTML = `<div class="message-content">${escapeHtml(msg.content)}</div>`;
                chatMessages.appendChild(messageDiv);
            });
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    } catch (error) {
        console.log('Chat geçmişi yüklenemedi');
    }
}

function closeChatModal() {
    const modal = document.getElementById('chatModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    const chatMessages = document.getElementById('chatMessages');
    
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'chat-message user-message';
    userMessageDiv.innerHTML = `<div class="message-content">${escapeHtml(message)}</div>`;
    chatMessages.appendChild(userMessageDiv);
    
    input.value = '';
    input.disabled = true;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const loadingId = 'chat-loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = 'chat-message bot-message';
    loadingDiv.innerHTML = `<div class="message-content" style="display: flex; align-items: center; gap: 4px;">
        <div style="width: 6px; height: 6px; background: #999; border-radius: 50%; animation: typingAnimation 1.4s infinite;"></div>
        <div style="width: 6px; height: 6px; background: #999; border-radius: 50%; animation: typingAnimation 1.4s infinite; animation-delay: 0.2s;"></div>
        <div style="width: 6px; height: 6px; background: #999; border-radius: 50%; animation: typingAnimation 1.4s infinite; animation-delay: 0.4s;"></div>
    </div>`;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        if (!currentUser || !currentUser.studentId) {
            throw new Error('Kullanıcı bilgisi bulunamadı');
        }

        const response = await fetch(`${window.API_URL}/api/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentId: currentUser.studentId,
                message: message
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        if (data.success) {
            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'chat-message bot-message';
            
            let reply = data.reply;
            let navButton = '';
            
            const navRegex = /\[🔗\s*Sayfaya\s*Git:\s*([^\]]+)\]/i;
            const match = reply.match(navRegex);
            
            if (match) {
                const pageName = match[1].trim();
                
                if (pageName === 'Admin' && currentUser.role !== 'admin') {
                    reply = reply.replace(navRegex, '').trim();
                } else {
                    const pageMap = {
                        'Profil': 'profilePage',
                        'Eşleştirme': 'matchingPage',
                        'Quiz': 'quizPage',
                        'Boşluk Doldurma': 'fillBlankPage',
                        'Kelime Ekleme': 'wordAddPage',
                        'Tüm Kelimeler': 'allWordsPage',
                        'Admin': 'adminPage'
                    };
                    
                    const pageId = pageMap[pageName];
                    if (pageId) {
                        navButton = `<button class="chat-nav-btn" onclick="showPage('${pageId}'); closeChatModal();">👉 ${pageName}'e Git</button>`;
                        reply = reply.replace(navRegex, '').trim();
                    }
                }
            }
            
            botMessageDiv.innerHTML = `<div class="message-content">${escapeHtml(reply)}</div>${navButton ? '<div style="margin-top:10px;">' + navButton + '</div>' : ''}`;
            chatMessages.appendChild(botMessageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'chat-message bot-message';
            errorDiv.innerHTML = `<div class="message-content">❌ ${escapeHtml(data.message || 'Bilinmeyen hata')}</div>`;
            chatMessages.appendChild(errorDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    } catch (error) {
        console.error('Chat hatası:', error);
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chat-message bot-message';
        errorDiv.innerHTML = `<div class="message-content">❌ ${escapeHtml(error.message || 'Sunucu bağlantı hatası!')}</div>`;
        chatMessages.appendChild(errorDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } finally {
        input.disabled = false;
        input.focus();
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendChatMessage();
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== ADMIN AI ASISTAN FONKSIYONLARI =====

function clearAdminAiChat() {
    const chatBox = document.getElementById('adminAiChatBox');
    chatBox.innerHTML = `
        <div style="background: #e0e7ff; padding: 12px; border-radius: 8px; text-align: center; color: #667eea; font-weight: 500;">
            🤖 Merhaba! Size nasıl yardımcı olabilirim?
        </div>
    `;
    document.getElementById('adminAiResultsContainer').style.display = 'none';
}

async function sendAdminAiMessage() {
    const input = document.getElementById('adminAiInput');
    
    if (!input) {
        alert('❌ Input element bulunamadı!');
        return;
    }
    
    const message = input.value.trim();
    
    if (!message) {
        alert('❌ Lütfen bir komut yazın!');
        return;
    }
    
    if (!currentUser || !currentUser.studentId) {
        alert('❌ Kullanıcı bilgisi bulunamadı!');
        return;
    }
    
    const chatBox = document.getElementById('adminAiChatBox');
    
    input.value = '';
    input.disabled = true;
    
    displayAdminAiMessage(message, 'user');
    
    const loadingId = 'loading-' + Date.now();
    displayAdminAiMessage('⏳', 'loading', loadingId);
    
    try {
        const response = await fetch(`${window.API_URL}/api/chat/admin-ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adminId: currentUser.studentId,
                message: message
            })
        });
        
        const data = await response.json();
        console.log('Admin AI Response:', data);
        
        removeLoadingIndicator(loadingId);
        
        if (data.success) {
            displayAdminAiMessage(data.message, 'ai');
            
            if (data.actionResult) {
                displayActionResults(data.actionResult);
            }
        } else {
            displayAdminAiMessage('❌ ' + (data.message || 'Hata oluştu'), 'error');
        }
    } catch (error) {
        console.error('AI İsteği hatası:', error);
        removeLoadingIndicator(loadingId);
        displayAdminAiMessage('❌ Sunucu bağlantı hatası: ' + error.message, 'error');
    } finally {
        input.disabled = false;
        input.focus();
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function displayAdminAiMessage(message, sender, loadingId) {
    const chatBox = document.getElementById('adminAiChatBox');
    
    const messageDiv = document.createElement('div');
    messageDiv.id = loadingId || '';
    messageDiv.style.display = 'flex';
    messageDiv.style.justifyContent = sender === 'user' ? 'flex-end' : 'flex-start';
    messageDiv.style.animation = 'slideIn 0.3s ease';
    
    if (sender === 'loading') {
        const loadingContainer = document.createElement('div');
        loadingContainer.style.display = 'flex';
        loadingContainer.style.alignItems = 'center';
        loadingContainer.style.gap = '4px';
        loadingContainer.style.padding = '8px 12px';
        loadingContainer.style.background = '#f0f0f0';
        loadingContainer.style.borderRadius = '8px';
        loadingContainer.style.width = 'fit-content';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.style.width = '6px';
            dot.style.height = '6px';
            dot.style.background = '#999';
            dot.style.borderRadius = '50%';
            dot.style.animation = `typingAnimation 1.4s infinite`;
            dot.style.animationDelay = (i * 0.2) + 's';
            loadingContainer.appendChild(dot);
        }
        
        messageDiv.appendChild(loadingContainer);
    } else {
        const messageContent = document.createElement('div');
        messageContent.style.maxWidth = '95%';
        messageContent.style.padding = '10px 14px';
        messageContent.style.borderRadius = '8px';
        messageContent.style.wordBreak = 'break-word';
        messageContent.style.overflowWrap = 'break-word';
        messageContent.style.whiteSpace = 'pre-wrap';
        messageContent.style.fontSize = '13px';
        messageContent.style.lineHeight = '1.5';
        
        if (sender === 'user') {
            messageContent.style.background = '#667eea';
            messageContent.style.color = 'white';
        } else if (sender === 'error') {
            messageContent.style.background = '#ffebee';
            messageContent.style.color = '#d32f2f';
            messageContent.style.borderLeft = '3px solid #d32f2f';
        } else {
            messageContent.style.background = '#f0f0f0';
            messageContent.style.color = '#333';
        }
        
        messageContent.textContent = message;
        messageDiv.appendChild(messageContent);
    }
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLoadingIndicator(loadingId) {
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
        loadingElement.remove();
    }
}

function displayActionResults(actionResult) {
    const resultsContainer = document.getElementById('adminAiResultsContainer');
    const resultsDiv = document.getElementById('adminAiResults');
    
    if (!actionResult.data || actionResult.data.length === 0) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    resultsContainer.style.display = 'block';
    
    let html = '';
    
    if (actionResult.type === 'student_list') {
        html = `
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #667eea; color: white;">
                        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Adı Soyadı</th>
                        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Öğrenci No</th>
                        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Sınıf</th>
                        <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Puan</th>
                        <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Durum</th>
                    </tr>
                </thead>
                <tbody>
                    ${actionResult.data.map((student, idx) => `
                        <tr style="background: ${idx % 2 === 0 ? '#fafafa' : 'white'};">
                            <td style="padding: 8px; border: 1px solid #ddd;">${student.name}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${student.studentId}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${student.class}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #667eea;">${student.points || 0}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
                                ${student.isBanned ? '<span style="color: #d32f2f;">🚫 Yasaklı</span>' : '<span style="color: #10b981;">✅ Aktif</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (actionResult.type === 'top_students') {
        html = `
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #667eea; color: white;">
                        <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">🏆</th>
                        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Adı Soyadı</th>
                        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Öğrenci No</th>
                        <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Puan</th>
                    </tr>
                </thead>
                <tbody>
                    ${actionResult.data.map((student, idx) => `
                        <tr style="background: ${idx % 2 === 0 ? '#fafafa' : 'white'};">
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #f59e0b;">#${student.rank}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${student.name}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${student.studentId}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #667eea;">${student.points}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (actionResult.type === 'banned_students') {
        html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;">
                ${actionResult.data.map(student => `
                    <div style="background: white; padding: 12px; border: 1px solid #e5e7eb; border-left: 4px solid #d32f2f; border-radius: 6px;">
                        <div style="font-weight: bold; color: #333; margin-bottom: 5px;">${student.name}</div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 3px;">ID: ${student.studentId}</div>
                        <div style="font-size: 11px; color: #d32f2f; background: #ffebee; padding: 5px; border-radius: 4px;">
                            Sebep: ${student.banReason}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (actionResult.type === 'student_notes') {
        const { studentName, studentId, notes } = actionResult.data;
        html = `
            <div style="background: white; padding: 15px; border: 2px solid #667eea; border-radius: 8px;">
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
                    <div style="font-weight: bold; font-size: 16px; color: #333; margin-bottom: 5px;">👤 ${studentName}</div>
                    <div style="font-size: 12px; color: #666;">Öğrenci No: ${studentId}</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${notes.map(note => `
                        <div style="background: #f9fafb; padding: 10px; border-left: 4px solid #667eea; border-radius: 4px;">
                            <div style="color: #333; margin-bottom: 5px;">${note.note}</div>
                            <div style="font-size: 11px; color: #999;">
                                👤 ${note.addedBy} • ${new Date(note.addedAt).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    resultsDiv.innerHTML = html;
}

// KVKK Modal Functions
function openKVKKModal() {
    const modal = document.getElementById('kvkkModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeKVKKModal() {
    const modal = document.getElementById('kvkkModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

document.addEventListener('click', (e) => {
    const modal = document.getElementById('kvkkModal');
    if (modal && e.target === modal) {
        closeKVKKModal();
    }
});

// Enter tuşu desteği
document.addEventListener('keypress', (e) => {
    if (e.target.id === 'adminAiInput' && e.key === 'Enter') {
        sendAdminAiMessage();
    }
});

// INFO MODAL FUNCTIONS
function openInfoModal() {
    document.getElementById('infoModal').classList.add('active');
}

function closeInfoModal() {
    document.getElementById('infoModal').classList.remove('active');
}

// Close modal when clicking outside
document.getElementById('infoModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeInfoModal();
    }
});

const AVATARS = ['😊', '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '😉', 
                 '😍', '🥰', '😘', '😗', '😚', '🙂', '🤐', '🤔', '😐', '😑', 
                 '😶', '🤥', '😔', '😪', '🤢', '🤮', '😷', '🤒', '🤡', '👽'];

function openAvatarModal() {
    const modal = document.getElementById('avatarModal');
    const grid = document.getElementById('avatarGrid');
    
    grid.innerHTML = AVATARS.map(avatar => 
        `<div class="avatar-option ${currentUser.avatar === avatar ? 'selected' : ''}" onclick="selectAvatar('${avatar}')">${avatar}</div>`
    ).join('');
    
    modal.style.display = 'flex';
}

function closeAvatarModal() {
    document.getElementById('avatarModal').style.display = 'none';
}

async function selectAvatar(avatar) {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${window.API_URL}/api/words/change-avatar/${currentUser.studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar })
        });
        
        if (response.ok) {
            currentUser.avatar = avatar;
            document.getElementById('profileAvatarDisplay').textContent = avatar;
            document.getElementById('headerProfileBtn').textContent = avatar;
            
            const selected = document.querySelector('.avatar-option.selected');
            if (selected) selected.classList.remove('selected');
            
            const grid = document.getElementById('avatarGrid');
            const avatarOptions = grid.querySelectorAll('.avatar-option');
            avatarOptions.forEach(option => {
                if (option.textContent === avatar) {
                    option.classList.add('selected');
                }
            });
        }
    } catch (error) {
        console.error('Avatar değişikliği hatası:', error);
    }
}

function renderBadges(badge, nextBadge) {
    const display = document.getElementById('badgeDisplay');
    if (!display) return;
    
    let html = '';
    
    if (badge) {
        html += `<div class="badge-item"><div class="badge-icon">${badge.emoji}</div><div class="badge-name">${badge.name}</div></div>`;
    }
    
    if (nextBadge) {
        html += `<div class="badge-item badge-upcoming"><div class="badge-icon">${nextBadge.emoji}</div><div class="badge-name">${nextBadge.name}</div></div>`;
    }
    
    display.innerHTML = html;
    
    const progressSection = document.getElementById('badgeProgressSection');
    if (progressSection && nextBadge && currentUser) {
        try {
            const currentPoints = currentUser.points || 0;
            const nextBadgePoints = nextBadge.points || 0;
            const currentBadgePoints = badge ? badge.points : 0;
            const pointsNeeded = Math.max(0, nextBadgePoints - currentPoints);
            const totalRange = Math.max(1, nextBadgePoints - currentBadgePoints);
            const progress = Math.max(0, Math.min(100, ((currentPoints - currentBadgePoints) / totalRange) * 100));
            
            document.getElementById('nextBadgeEmoji').textContent = nextBadge.emoji;
            document.getElementById('nextBadgeName').textContent = nextBadge.name;
            document.getElementById('badgeProgressFill').style.width = progress + '%';
            document.getElementById('badgeProgressText').textContent = `${pointsNeeded} puan daha`;
            progressSection.style.display = 'block';
        } catch (error) {
            console.error('Badge progress hatası:', error);
            progressSection.style.display = 'none';
        }
    }
}

function renderDailyStreak(dailyStreak, streakBonusPoints) {
    const streakSection = document.getElementById('dailyStreakSection');
    if (!streakSection) {
        console.warn('dailyStreakSection element not found');
        return;
    }
    
    console.log('Rendering streak:', dailyStreak, streakBonusPoints);
    
    let streakNum = parseInt(dailyStreak) || 0;
    const bonusPoints = parseInt(streakBonusPoints) || 50;
    
    // Eğer bonus var ama streak 0 ise, en az 1 gün olmalı
    if (streakNum === 0 && bonusPoints > 0) {
        console.warn('Streak 0 but bonus > 0. Correcting to 1.');
        streakNum = 1;
    }
    
    if (streakNum > 0 || bonusPoints > 0) {
        try {
            document.getElementById('streakNumber').textContent = streakNum;
            document.getElementById('streakBonusAmount').textContent = `+${bonusPoints}`;
            
            let message = '';
            if (streakNum === 1) {
                message = 'Harika başladın! 🚀 Yarın tekrar gir.';
            } else if (streakNum === 2) {
                message = 'Momentum kazandın! 💪 Devam et.';
            } else if (streakNum === 3) {
                message = 'Seri halinde gidiyorsun! 🔥';
            } else if (streakNum === 5) {
                message = 'Beş gün seri! Muhteşem! ⭐';
            } else if (streakNum === 7) {
                message = 'Bir haftalık seri! Efsane! 👑';
            } else if (streakNum === 10) {
                message = 'On gün seri! Ölümsüz! 💎';
            } else if (streakNum >= 30) {
                message = 'Ayı doldurdun! Süper yıldız! ✨';
            } else {
                message = `${streakNum} gün seri devam ediyor! 🔥`;
            }
            
            document.getElementById('streakMessage').textContent = message;
            streakSection.style.display = 'block';
        } catch (error) {
            console.error('Streak render error:', error);
            streakSection.style.display = 'none';
        }
    } else {
        streakSection.style.display = 'none';
    }
}

document.getElementById('avatarModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeAvatarModal();
    }
});

let currentGameType = null;

function openGameModeModal(gameType) {
    currentGameType = gameType;
    document.getElementById('gameModeModal').style.display = 'flex';
}

function closeGameModeModal() {
    document.getElementById('gameModeModal').style.display = 'none';
}

function startSoloGame() {
    closeGameModeModal();
    const gameTypeHandlers = {
        'matching': () => {
            startMatchingGameContent();
        },
        'quiz': () => {
            startQuizGameContent();
        },
        'fillblank': () => {
            startFillBlankGameContent();
        }
    };
    
    if (gameTypeHandlers[currentGameType]) {
        gameTypeHandlers[currentGameType]();
    }
}

function startMatchingGameContent() {
    if (allWords.length === 0) {
        alert('❌ Henüz kelime eklenmemiş! Önce kelime ekleyin.');
        return;
    }
    let availableWords = allWords.filter(w => w.status === 'approved');
    if (availableWords.length === 0) {
        alert('❌ Onaylı kelime yok! Lütfen kelime ekleyin ve admin onayı bekleyin.');
        return;
    }
    if (availableWords.length < 2) {
        alert('❌ En az 2 kelime gerekli!');
        return;
    }
    
    availableWords = availableWords.sort(() => Math.random() - 0.5).slice(0, 5);
    
    matchingState.words = availableWords;
    matchingState.matched = [];
    matchingState.score = 0;
    matchingState.selectedWord = null;
    matchingState.selectedMeaning = null;
    matchingState.timeLeft = 60;
    
    if (matchingState.timerInterval) {
        clearInterval(matchingState.timerInterval);
    }
    
    document.getElementById('matchingMessage').innerHTML = '';

    // Reset finish button
    const finishBtn = document.getElementById('matchingFinishBtn');
    if (finishBtn) {
        finishBtn.disabled = false;
        finishBtn.textContent = '✅ Bitir & Puanı Al';
    }

    switchPage('matchingPage');
    initMatchingGame();
    startMatchingTimer();
}

function startQuizGameContent() {
    if (allWords.length === 0) {
        alert('❌ Henüz kelime eklenmemiş! Önce kelime ekleyin.');
        return;
    }
    
    switchPage('quizPage');
    loadQuizGame();
}

function startFillBlankGameContent() {
    if (allWords.length === 0) {
        alert('❌ Henüz kelime eklenmemiş! Önce kelime ekleyin.');
        return;
    }
    
    switchPage('fillBlankPage');
    loadFillBlankGame();
}

function showInviteForm() {
    closeGameModeModal();
    document.getElementById('gameInviteModal').style.display = 'flex';
    document.getElementById('friendStudentId').value = '';
    document.getElementById('inviteMessage').innerHTML = '';
}

function closeGameInviteModal() {
    document.getElementById('gameInviteModal').style.display = 'none';
    document.getElementById('friendStudentId').value = '';
    document.getElementById('inviteMessage').innerHTML = '';
}

async function sendGameInvite() {
    const friendStudentId = document.getElementById('friendStudentId').value.trim();
    const messageEl = document.getElementById('inviteMessage');
    
    if (!friendStudentId) {
        messageEl.innerHTML = '❌ Lütfen okul numarası girin';
        messageEl.className = 'invite-message error';
        return;
    }
    
    if (!currentUser) {
        messageEl.innerHTML = '❌ Lütfen giriş yapın';
        messageEl.className = 'invite-message error';
        return;
    }
    
    if (currentUser.studentId === friendStudentId) {
        messageEl.innerHTML = '❌ Kendinizi davet edemezsiniz';
        messageEl.className = 'invite-message error';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/games/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fromStudentId: currentUser.studentId,
                toStudentId: friendStudentId
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageEl.innerHTML = '✅ Davet gönderildi! Oyuna giriliyor...';
            messageEl.className = 'invite-message success';
            
            setTimeout(() => {
                closeGameInviteModal();
                window.gameSessionId = data.gameSessionId;
                window.currentGameSession = data.gameSession;
                window.currentGameSessionWords = [];
                multiplayerState.sessionId = data.gameSessionId;
                switchPage('multiplayerPage');
                showWaitingForOpponent();
                checkGameInvitationAcceptance(data.invitation._id, data.gameSessionId);
            }, 1000);
        } else {
            messageEl.innerHTML = `❌ ${data.message || 'Davet gönderilemedi'}`;
            messageEl.className = 'invite-message error';
        }
    } catch (error) {
        console.error('Davet gönderme hatası:', error);
        messageEl.innerHTML = '❌ Hata oluştu. Tekrar deneyin';
        messageEl.className = 'invite-message error';
    }
}

function showGameWaitingScreen(friendStudentId) {
    document.getElementById('friendName').textContent = `Arkadaşı bekleniyor: ${friendStudentId}`;
    document.getElementById('gameWaitingScreen').classList.add('active');
}

function cancelGameWait() {
    if (invitationCheckInterval) {
        clearInterval(invitationCheckInterval);
        invitationCheckInterval = null;
    }
    document.getElementById('gameWaitingScreen').classList.remove('active');
}

function closeGameRejectionScreen() {
    document.getElementById('gameRejectionScreen').classList.remove('active');
}

let invitationCheckInterval = null;

function checkGameInvitationStatus(invitationId) {
    invitationCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_URL}/api/games/invitation/${invitationId}`, {
                method: 'GET'
            });
            
            const data = await response.json();
            
            if (data.status === 'accepted') {
                clearInterval(invitationCheckInterval);
                document.getElementById('gameWaitingScreen').classList.remove('active');
                
                document.getElementById('friendName').textContent = '✅ Arkadaş katıldı!';
                setTimeout(() => {
                    startMultiplayerGame(data.gameSessionId);
                }, 1500);
            } else if (data.status === 'rejected') {
                clearInterval(invitationCheckInterval);
                document.getElementById('gameWaitingScreen').classList.remove('active');
                document.getElementById('gameRejectionScreen').classList.add('active');
            }
        } catch (error) {
            console.error('İstek durumu kontrol hatası:', error);
        }
    }, 2000);
    
    setTimeout(() => {
        if (invitationCheckInterval) {
            clearInterval(invitationCheckInterval);
            document.getElementById('gameWaitingScreen').classList.remove('active');
            document.getElementById('gameRejectionScreen').classList.add('active');
        }
    }, 120000);
}

async function startMultiplayerGame(gameSessionId) {
    try {
        if (!gameSessionId || gameSessionId === 'undefined' || gameSessionId === '') {
            console.error('❌ gameSessionId undefined:', { gameSessionId, type: typeof gameSessionId });
            alert('❌ Oyun oturumu bulunamadı. Bildirim verilerini kontrol edin.');
            return;
        }
        
        console.log('🎮 Oyun başlatılıyor:', gameSessionId);
        const response = await fetch(`${window.API_URL}/api/games/session/${gameSessionId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'all', studentId: currentUser.studentId })
        });

        const data = await response.json();
        console.log('📦 API Cevab:', data);
        
        if (response.ok && data.success) {
            window.currentGameSession = data.session;
            window.currentGameSessionWords = data.words || [];
            window.gameSessionId = gameSessionId;
            
            console.log('✅ Kelimeler yüklendi:', window.currentGameSessionWords.length);
            
            initMultiplayerGame();
            switchPage('multiplayerPage');
        } else {
            console.error('❌ Oyun başlatılamadı:', data.message);
            alert(`❌ Oyun başlatılamadı: ${data.message || 'Bilinmeyen hata'}`);
        }
    } catch (error) {
        console.error('❌ startMultiplayerGame Hata:', error);
        alert('❌ Bağlantı hatası: ' + error.message);
    }
}

let multiplayerState = {
    sessionId: null,
    playerIndex: null,
    words: [],
    currentWordIndex: 0,
    currentPlayerIndex: 0,
    playerScores: [
        { name: 'Oyuncu 1', score: 0, correct: 0, total: 0 },
        { name: 'Oyuncu 2', score: 0, correct: 0, total: 0 }
    ],
    timeLeft: 15,
    timerInterval: null,
    questionStartTime: null,
    isAnswering: false
};

function initMultiplayerGame() {
    const board = document.getElementById('multiplayerBoard');
    if (!board) {
        console.error('❌ multiplayerBoard bulunamadı');
        return;
    }

    const words = window.currentGameSessionWords || [];
    console.log('📚 Oyun başlatılıyor, kelimeler:', words.length);
    if (words.length > 0) {
        console.log('📝 İlk kelime:', words[0]);
        console.log('📝 Son kelime:', words[words.length - 1]);
    }
    
    if (words.length === 0) {
        board.innerHTML = '<div class="empty-state"><h3>❌ Kelime bulunamadı</h3></div>';
        return;
    }

    multiplayerState.sessionId = window.currentGameSession._id;
    multiplayerState.words = words;
    multiplayerState.currentWordIndex = 0;
    multiplayerState.currentPlayerIndex = 0;
    
    const playerStudentIds = window.currentGameSession.playerStudentIds || [];
    multiplayerState.playerIndex = playerStudentIds.indexOf(currentUser.studentId);
    
    const playerScores = window.currentGameSession.playerScores || [];
    multiplayerState.playerScores = [
        { name: playerScores[0]?.playerName || window.currentGameSession.playerStudentIds[0], score: 0, correct: 0, total: 0 },
        { name: playerScores[1]?.playerName || window.currentGameSession.playerStudentIds[1], score: 0, correct: 0, total: 0 }
    ];
    
    console.log('👥 Oyuncular:', multiplayerState.playerScores.map(p => p.name), '👤 Bu oyuncu:', multiplayerState.playerIndex);
    
    multiplayerState.timeLeft = 15;

    if (multiplayerState.timerInterval) {
        clearInterval(multiplayerState.timerInterval);
    }

    displayNextQuestion();
}

function displayNextQuestion() {
    const board = document.getElementById('multiplayerBoard');
    
    if (multiplayerState.currentWordIndex >= multiplayerState.words.length) {
        endMultiplayerGame();
        return;
    }

    if (multiplayerState.timerInterval) {
        clearInterval(multiplayerState.timerInterval);
    }
    
    multiplayerState.timeLeft = 15;

    const currentWord = multiplayerState.words[multiplayerState.currentWordIndex];
    const currentPlayer = multiplayerState.playerScores[multiplayerState.currentPlayerIndex];
    const otherPlayer = multiplayerState.playerScores[1 - multiplayerState.currentPlayerIndex];
    
    const isCurrentPlayerTurn = window.currentGameSession && 
                                window.currentGameSession.playerStudentIds[multiplayerState.currentPlayerIndex] === currentUser.studentId;

    board.innerHTML = `
        <div style="padding: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="padding: 15px; background: ${multiplayerState.currentPlayerIndex === 0 ? '#3498db' : '#e0e0e0'}; border-radius: 10px; text-align: center; color: white;">
                    <div style="font-size: 12px; opacity: 0.8;">${multiplayerState.playerScores[0].name}</div>
                    <div style="font-size: 24px; font-weight: bold;">🏆 ${multiplayerState.playerScores[0].score}</div>
                </div>
                <div style="padding: 15px; background: ${multiplayerState.currentPlayerIndex === 1 ? '#e74c3c' : '#e0e0e0'}; border-radius: 10px; text-align: center; color: white;">
                    <div style="font-size: 12px; opacity: 0.8;">${multiplayerState.playerScores[1].name}</div>
                    <div style="font-size: 24px; font-weight: bold;">🏆 ${multiplayerState.playerScores[1].score}</div>
                </div>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <div style="text-align: center; margin-bottom: 10px;">
                    <span style="font-size: 14px; color: #7f8c8d;">Soru ${multiplayerState.currentWordIndex + 1}/${multiplayerState.words.length}</span>
                </div>
                <div id="gameTimer" style="text-align: center; font-size: 32px; font-weight: bold; color: #2c3e50; margin: 20px 0;">
                    ⏱️ ${multiplayerState.timeLeft}s
                </div>
                <div style="text-align: center; font-size: 14px; color: #7f8c8d;">
                    Sıra: 👤 ${multiplayerState.playerScores[multiplayerState.currentPlayerIndex].name}
                </div>
            </div>

            <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #3498db; margin-bottom: 20px;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 5px;">KELIME</div>
                    <div style="font-size: 28px; font-weight: bold; color: #2c3e50;">${currentWord.word}</div>
                </div>
            </div>

            <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #27ae60; margin-bottom: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 10px;">ANLAMI DOĞRU MU?</div>
                    <div style="font-size: 18px; font-weight: 500; color: #2c3e50; line-height: 1.8; background: #f0f0f0; padding: 15px; border-radius: 8px;">${currentWord.meaning}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button onclick="${isCurrentPlayerTurn ? 'submitAnswer(true)' : ''}" style="padding: 15px; background: ${isCurrentPlayerTurn ? '#2ecc71' : '#95a5a6'}; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: ${isCurrentPlayerTurn ? 'pointer' : 'not-allowed'}; opacity: ${isCurrentPlayerTurn ? '1' : '0.6'}; transition: all 0.3s; ${!isCurrentPlayerTurn ? 'pointer-events: none;' : ''}">
                    ✅ EVET
                </button>
                <button onclick="${isCurrentPlayerTurn ? 'submitAnswer(false)' : ''}" style="padding: 15px; background: ${isCurrentPlayerTurn ? '#e74c3c' : '#95a5a6'}; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: ${isCurrentPlayerTurn ? 'pointer' : 'not-allowed'}; opacity: ${isCurrentPlayerTurn ? '1' : '0.6'}; transition: all 0.3s; ${!isCurrentPlayerTurn ? 'pointer-events: none;' : ''}">
                    ❌ HAYIR
                </button>
            </div>
        </div>
    `;

    startQuestionTimer();
}

async function submitAnswer(isCorrect) {
    if (multiplayerState.timerInterval) {
        clearInterval(multiplayerState.timerInterval);
    }

    if (!currentUser || !multiplayerState.sessionId) {
        console.error('❌ Oyun bilgileri eksik', { currentUser: !!currentUser, sessionId: multiplayerState.sessionId });
        return;
    }

    const isCurrentPlayer = window.currentGameSession && 
                           window.currentGameSession.playerStudentIds[multiplayerState.currentPlayerIndex] === currentUser.studentId;
    
    if (!isCurrentPlayer) {
        console.warn('⚠️ Sıra sizde değil, cevap gönderilmiyor');
        return;
    }

    try {
        const response = await fetch(`${window.API_URL}/api/games/session/${multiplayerState.sessionId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: currentUser.studentId,
                wordIndex: multiplayerState.currentWordIndex,
                answer: isCorrect,
                currentPlayerIndex: multiplayerState.currentPlayerIndex
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Sunucu hatası:', data.message);
            return;
        }

        const board = document.getElementById('multiplayerBoard');
        const isAnswerCorrect = data.isCorrect;

        if (isAnswerCorrect) {
            board.innerHTML = `
                <div style="padding: 40px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 400px; background: linear-gradient(135deg, #2ecc71, #27ae60);">
                    <div style="font-size: 120px; margin-bottom: 20px; animation: bounce 0.6s ease-in-out;">✅</div>
                    <div style="font-size: 48px; font-weight: bold; color: white; margin-bottom: 10px;">DOĞRU!</div>
                    <div style="font-size: 24px; color: white; opacity: 0.9;">+20 Puan</div>
                </div>
            `;
            console.log(`✅ Doğru! +20 puan`);
        } else {
            board.innerHTML = `
                <div style="padding: 40px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 400px; background: linear-gradient(135deg, #e74c3c, #c0392b);">
                    <div style="font-size: 120px; margin-bottom: 20px; animation: shake 0.5s ease-in-out;">❌</div>
                    <div style="font-size: 48px; font-weight: bold; color: white; margin-bottom: 10px;">YANLIŞ!</div>
                    <div style="font-size: 24px; color: white; opacity: 0.9;">Puan yok</div>
                </div>
            `;
            console.log(`❌ Yanlış!`);
        }

        multiplayerState.playerScores = data.playerScores.map(ps => ({
            name: ps.name,
            score: ps.score,
            correct: ps.correct,
            total: ps.total
        }));
        
        multiplayerState.currentPlayerIndex = data.currentPlayerIndex;
        multiplayerState.currentWordIndex = data.currentWordIndex;
        
        window.currentGameSession.currentPlayerIndex = data.currentPlayerIndex;
        window.currentGameSession.currentWordIndex = data.currentWordIndex;
        window.currentGameSession.playerScores = data.playerScores;
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (multiplayerState.currentWordIndex >= multiplayerState.words.length) {
            endMultiplayerGame();
        } else {
            displayNextQuestion();
        }
    } catch (error) {
        console.error('Cevap gönderme hatası:', error);
    }
}

let gameStateSyncInterval = null;

async function startSyncingGameState() {
    if (gameStateSyncInterval) {
        clearInterval(gameStateSyncInterval);
    }
    
    gameStateSyncInterval = setInterval(async () => {
        try {
            const sessionId = multiplayerState.sessionId || window.gameSessionId;
            if (!sessionId) return;
            
            const response = await fetch(`${window.API_URL}/api/games/session/${sessionId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.session) {
                    const session = data.session;
                    
                    const oldWordIndex = multiplayerState.currentWordIndex;
                    const oldPlayerIndex = multiplayerState.currentPlayerIndex;
                    
                    multiplayerState.currentWordIndex = session.currentWordIndex || 0;
                    multiplayerState.currentPlayerIndex = session.currentPlayerIndex || 0;
                    
                    if (session.playerScores && session.playerScores.length === 2) {
                        multiplayerState.playerScores[0].score = session.playerScores[0].score || 0;
                        multiplayerState.playerScores[0].correct = session.playerScores[0].correctAnswers || 0;
                        multiplayerState.playerScores[0].total = session.playerScores[0].totalAnswered || 0;
                        
                        multiplayerState.playerScores[1].score = session.playerScores[1].score || 0;
                        multiplayerState.playerScores[1].correct = session.playerScores[1].correctAnswers || 0;
                        multiplayerState.playerScores[1].total = session.playerScores[1].totalAnswered || 0;
                    }
                    
                    if (session.status === 'completed' || session.status === 'abandoned') {
                        clearInterval(gameStateSyncInterval);
                        handleGameEnd(session);
                    }
                    
                    if (oldPlayerIndex !== multiplayerState.currentPlayerIndex || oldWordIndex !== multiplayerState.currentWordIndex) {
                        displayNextQuestion();
                    }
                }
            }
        } catch (error) {
            console.log('Game state sync error (continuing):', error);
        }
    }, 500);
}

function stopSyncingGameState() {
    if (gameStateSyncInterval) {
        clearInterval(gameStateSyncInterval);
        gameStateSyncInterval = null;
    }
}

function startQuestionTimer() {
    multiplayerState.questionStartTime = Date.now();
    const QUESTION_DURATION = 15000;
    
    if (multiplayerState.timerInterval) {
        clearInterval(multiplayerState.timerInterval);
    }
    
    multiplayerState.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - multiplayerState.questionStartTime) / 1000);
        multiplayerState.timeLeft = Math.max(0, 15 - elapsed);
        
        const timerEl = document.getElementById('gameTimer');
        if (timerEl) {
            timerEl.textContent = `⏱️ ${multiplayerState.timeLeft}s`;
        }

        if (multiplayerState.timeLeft <= 0) {
            clearInterval(multiplayerState.timerInterval);
            
            const isCurrentPlayer = window.currentGameSession && 
                                   window.currentGameSession.playerStudentIds[multiplayerState.currentPlayerIndex] === currentUser.studentId;
            
            if (isCurrentPlayer) {
                console.log('⏰ Zaman doldu, otomatik yanlış cevap gönderiliyor...');
                submitAnswer(false);
            } else {
                console.log('⏰ Zaman doldu ama sıra sizde değil, bekle...');
            }
        }
    }, 100);
}

function showWaitingForOpponent() {
    const board = document.getElementById('multiplayerBoard');
    const playerNames = window.currentGameSession?.playerScores || [];
    const opponentName = playerNames[1]?.playerName || 'Rakip';
    
    board.innerHTML = `
        <div style="padding: 40px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 400px;">
            <div style="font-size: 60px; margin-bottom: 20px; animation: bounce 1.5s infinite;">⏳</div>
            <h2 style="color: #2c3e50; margin-bottom: 10px;">Oyun Hazırlığında...</h2>
            <p style="color: #7f8c8d; font-size: 18px; margin-bottom: 30px;">
                <strong>${opponentName}</strong> oyunu kabul etmesini bekleniyor...
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <div style="width: 12px; height: 12px; background: #3498db; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                <div style="width: 12px; height: 12px; background: #3498db; border-radius: 50%; animation: pulse 1.5s infinite 0.2s;"></div>
                <div style="width: 12px; height: 12px; background: #3498db; border-radius: 50%; animation: pulse 1.5s infinite 0.4s;"></div>
            </div>
        </div>
    `;
}

let invitationAcceptanceCheckInterval = null;

async function checkGameInvitationAcceptance(invitationId, gameSessionId) {
    invitationAcceptanceCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`${window.API_URL}/api/games/invitation/${invitationId}`, {
                method: 'GET'
            });
            
            const data = await response.json();
            
            if (data.status === 'accepted') {
                clearInterval(invitationAcceptanceCheckInterval);
                showCountdown();
            }
        } catch (error) {
            console.error('Davet durumu kontrol hatası:', error);
        }
    }, 1000);
}

function showCountdown() {
    const board = document.getElementById('multiplayerBoard');
    let countdown = 3;
    
    console.log('🎮 Countdown başlıyor - SessionId:', multiplayerState.sessionId || window.gameSessionId);
    
    function updateCountdown() {
        if (countdown > 0) {
            board.innerHTML = `
                <div style="padding: 40px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 400px;">
                    <h2 style="color: #2c3e50; margin-bottom: 40px;">✅ Oyun başlıyor!</h2>
                    <div style="font-size: 120px; font-weight: bold; color: #e74c3c; animation: pulse 0.5s infinite;">
                        ${countdown}
                    </div>
                </div>
            `;
            countdown--;
            setTimeout(updateCountdown, 1000);
        } else {
            console.log('🎮 Countdown bitti, oyun başlatılıyor...');
            startGameAfterCountdown();
        }
    }
    
    updateCountdown();
}

async function startGameAfterCountdown() {
    try {
        const sessionId = multiplayerState.sessionId || window.gameSessionId;
        
        console.log('🎮 startGameAfterCountdown - SessionId kontrol:', { 
            multiplayerSessionId: multiplayerState.sessionId, 
            windowSessionId: window.gameSessionId,
            finalSessionId: sessionId
        });
        
        if (!sessionId || sessionId === 'undefined') {
            console.error('❌ Session ID bulunamadı:', { multiplayerSessionId: multiplayerState.sessionId, windowSessionId: window.gameSessionId });
            const board = document.getElementById('multiplayerBoard');
            board.innerHTML = `<div class="empty-state"><h3>❌ Oyun oturumu bulunamadı</h3></div>`;
            return;
        }
        
        console.log('🎮 API çağrısı yapılıyor:', `${window.API_URL}/api/games/session/${sessionId}/start`);
        
        const response = await fetch(`${window.API_URL}/api/games/session/${sessionId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'all', studentId: currentUser.studentId })
        });

        const data = await response.json();
        
        console.log('🎮 API Cevabı:', { statusOk: response.ok, success: data.success, message: data.message });
        
        if (response.ok && data.success) {
            window.currentGameSession = data.session;
            window.currentGameSessionWords = data.words || [];
            window.gameSessionId = sessionId;
            
            multiplayerState.sessionId = sessionId;
            multiplayerState.words = data.words || [];
            multiplayerState.currentWordIndex = 0;
            multiplayerState.currentPlayerIndex = 0;
            
            const playerStudentIds = data.session.playerStudentIds || [];
            multiplayerState.playerIndex = playerStudentIds.indexOf(currentUser.studentId);
            
            const playerScores = data.session.playerScores || [];
            multiplayerState.playerScores = playerScores.map(ps => ({
                name: ps.playerName || ps.studentId,
                score: ps.score || 0,
                correct: ps.correctAnswers || 0,
                total: ps.totalAnswered || 0
            }));
            
            multiplayerState.timeLeft = 15;
            
            if (multiplayerState.timerInterval) {
                clearInterval(multiplayerState.timerInterval);
            }
            
            startSyncingGameState();
            displayNextQuestion();
        } else {
            const board = document.getElementById('multiplayerBoard');
            board.innerHTML = `<div class="empty-state"><h3>❌ Oyun başlatılamadı: ${data.message || 'Bilinmeyen hata'}</h3></div>`;
        }
    } catch (error) {
        console.error('Oyun başlatma hatası:', error);
        const board = document.getElementById('multiplayerBoard');
        board.innerHTML = `<div class="empty-state"><h3>❌ Bağlantı hatası</h3></div>`;
    }
}

async function quitMultiplayerGame() {
    const confirmed = confirm('Oyundan çıkmak istediğinize emin misiniz? Oyun iptal edilecektir.');
    if (!confirmed) {
        return;
    }
    
    try {
        stopSyncingGameState();
        
        if (multiplayerState.timerInterval) {
            clearInterval(multiplayerState.timerInterval);
        }

        if (window.currentGameSession && window.currentGameSession._id) {
            console.log('🛑 Oyun iptal ediliyor:', window.currentGameSession._id);
            await fetch(`${window.API_URL}/api/games/session/${window.currentGameSession._id}/abandon`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerIdWhoLeft: currentUser ? currentUser._id : 'unknown'
                })
            });
        }

        showProfilePage();
    } catch (error) {
        console.error('Oyundan çıkış hatası:', error);
        showProfilePage();
    }
}

async function reloadUserPoints() {
    try {
        const response = await fetch(`${window.API_URL}/api/user/profile`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.user) {
                currentUser.points = data.user.points;
                currentUser.gamesPlayed = data.user.gamesPlayed;
                currentUser.totalGameTime = data.user.totalGameTime;
            }
        }
    } catch (error) {
        console.error('Kullanıcı puanı yükleme hatası:', error);
    }
}

async function handleGameEnd(session) {
    try {
        stopSyncingGameState();
        console.log('🏁 Oyun sonlandırılıyor...');
        
        if (multiplayerState.timerInterval) {
            clearInterval(multiplayerState.timerInterval);
        }

        const response = await fetch(`${window.API_URL}/api/games/session/${session._id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        console.log('📦 Sunucu cevabı:', data);
        
        if (response.ok && data.success) {
            const player1 = multiplayerState.playerScores[0];
            const player2 = multiplayerState.playerScores[1];
            
            const currentPlayerIndex = multiplayerState.playerIndex;
            const currentPlayerScore = multiplayerState.playerScores[currentPlayerIndex];
            const otherPlayerScore = multiplayerState.playerScores[1 - currentPlayerIndex];
            
            let totalPoints = currentPlayerScore.score;
            if (currentPlayerScore.score > otherPlayerScore.score) {
                totalPoints += 100;
            } else if (currentPlayerScore.score === otherPlayerScore.score) {
                totalPoints += 50;
            }
            
            const board = document.getElementById('multiplayerBoard');
            const winner = player1.score > player2.score ? player1.name : player2.score > player1.score ? player2.name : 'Berabere';
            const isCurrentPlayerWinner = winner === currentPlayerScore.name;
            
            board.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🏆</div>
                    <h1 style="font-size: 32px; color: #2c3e50; margin-bottom: 30px;">OYUN BİTTİ!</h1>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
                        <div style="background: #3498db; color: white; padding: 30px; border-radius: 15px; ${player1.name === winner ? 'border: 3px solid #f39c12;' : ''}">
                            <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${player1.name}</div>
                            <div style="font-size: 48px; font-weight: bold; margin: 20px 0;">🏆 ${player1.score}${player1.name === winner && winner !== 'Berabere' ? ' + 100' : player1.score === player2.score && winner === 'Berabere' ? ' + 50' : ''}</div>
                            <div style="font-size: 14px; opacity: 0.9;">✅ ${player1.correct}/${player1.total} Doğru</div>
                        </div>
                        <div style="background: #e74c3c; color: white; padding: 30px; border-radius: 15px; ${player2.name === winner ? 'border: 3px solid #f39c12;' : ''}">
                            <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${player2.name}</div>
                            <div style="font-size: 48px; font-weight: bold; margin: 20px 0;">🏆 ${player2.score}${player2.name === winner && winner !== 'Berabere' ? ' + 100' : player2.score === player1.score && winner === 'Berabere' ? ' + 50' : ''}</div>
                            <div style="font-size: 14px; opacity: 0.9;">✅ ${player2.correct}/${player2.total} Doğru</div>
                        </div>
                    </div>

                    <div style="background: #f39c12; color: white; padding: 20px; border-radius: 10px; margin: 30px 0; font-size: 20px; font-weight: bold;">
                        ${winner === 'Berabere' ? '🤝 BERABERE! (+50 puan)' : '🎉 ' + winner + ' KAZANDI! (+100 puan)'}
                    </div>
                    
                    <div style="background: #2ecc71; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 16px;">
                        Sizin Toplam Puan: <strong>${totalPoints}</strong>
                    </div>

                    <button onclick="showProfilePage()" style="padding: 15px 40px; background: #27ae60; color: white; border: none; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer; margin-top: 20px;">
                        ← Profil Sayfasına Dön
                    </button>
                </div>
            `;
            
            await reloadUserPoints();
        } else {
            console.error('Hata:', data.message);
            alert(`❌ ${data.message || 'Oyun kaydedilemedi'}`);
            showProfilePage();
        }
    } catch (error) {
        console.error('❌ Oyun sonlandırma hatası:', error);
        showProfilePage();
    }
}

async function endMultiplayerGame() {
    const session = window.currentGameSession;
    if (!session) {
        console.error('❌ Session bulunamadı');
        showProfilePage();
        return;
    }
    await handleGameEnd(session);
}

document.getElementById('gameModeModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeGameModeModal();
    }
});

document.getElementById('gameInviteModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeGameInviteModal();
    }
});