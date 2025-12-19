const express = require('express');
const User = require('../models/User');
const Word = require('../models/Word');
const AdminLog = require('../models/AdminLog');
const Announcement = require('../models/Announcement');
const GameStatistics = require('../models/GameStatistics');
const PointsHistory = require('../models/PointsHistory');
const router = express.Router();

async function logAdminAction(adminId, adminName, action, targetId, targetName, details, reason = '') {
  try {
    const log = new AdminLog({
      adminId,
      adminName,
      action,
      targetId,
      targetName,
      details,
      reason,
      status: 'success'
    });
    await log.save();
  } catch (error) {
    console.error('Log kaydetme hatası:', error);
  }
}

router.post('/add-student', async (req, res) => {
  try {
    const { studentId, password, name, class: studentClass } = req.body;

    if (!studentId || !password || !name || !studentClass) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur' });
    }

    const existingUser = await User.findOne({ studentId });
    if (existingUser) {
      return res.status(409).json({ message: 'Bu öğrenci numarası zaten kayıtlı' });
    }

    const newUser = new User({
      studentId,
      password,
      name,
      class: studentClass,
      role: 'student',
      isFirstLogin: true
    });

    await newUser.save();

    res.json({
      success: true,
      message: `${name} başarıyla eklendi. İlk giriş sırasında şifre değiştirecek.`,
      user: {
        id: newUser._id,
        studentId: newUser.studentId,
        name: newUser.name,
        class: newUser.class,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Öğrenci ekleme hatası:', error);
    res.status(500).json({ message: 'Öğrenci ekleme hatası', error: error.message });
  }
});

router.post('/add-teacher', async (req, res) => {
  try {
    const { studentId, password, name } = req.body;

    if (!studentId || !password || !name) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur' });
    }

    const existingUser = await User.findOne({ studentId });
    if (existingUser) {
      return res.status(409).json({ message: 'Bu öğretmen numarası zaten kayıtlı' });
    }

    const newTeacher = new User({
      studentId,
      password,
      name,
      class: 'Öğretmen',
      role: 'teacher',
      isFirstLogin: true
    });

    await newTeacher.save();

    res.json({
      success: true,
      message: `${name} başarıyla eklendi. İlk giriş sırasında şifre değiştirecek.`,
      user: {
        id: newTeacher._id,
        studentId: newTeacher.studentId,
        name: newTeacher.name,
        class: newTeacher.class,
        role: newTeacher.role
      }
    });
  } catch (error) {
    console.error('Öğretmen ekleme hatası:', error);
    res.status(500).json({ message: 'Öğretmen ekleme hatası', error: error.message });
  }
});

router.post('/ban-student', async (req, res) => {
  try {
    const { studentId, banReason } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Öğrenci numarası zorunludur' });
    }

    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    user.isBanned = true;
    user.banReason = banReason || 'Yönetici tarafından yasaklandı';
    await user.save();

    res.json({
      success: true,
      message: `${user.name} başarıyla yasaklandı.`,
      user: {
        studentId: user.studentId,
        name: user.name,
        isBanned: user.isBanned,
        banReason: user.banReason
      }
    });
  } catch (error) {
    console.error('Öğrenci banlama hatası:', error);
    res.status(500).json({ message: 'Öğrenci banlama hatası', error: error.message });
  }
});

router.post('/unban-student', async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Öğrenci numarası zorunludur' });
    }

    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    user.isBanned = false;
    user.banReason = '';
    await user.save();

    res.json({
      success: true,
      message: `${user.name} başarıyla yasaklı listeden çıkarıldı.`,
      user: {
        studentId: user.studentId,
        name: user.name,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    console.error('Öğrenci yasaklama kaldırma hatası:', error);
    res.status(500).json({ message: 'Yasaklama kaldırma hatası', error: error.message });
  }
});

router.get('/all-students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      students: students.map(s => ({
        id: s._id,
        studentId: s.studentId,
        name: s.name,
        class: s.class,
        points: s.points,
        isBanned: s.isBanned,
        banReason: s.banReason,
        isFirstLogin: s.isFirstLogin,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('Öğrenciler getirme hatası:', error);
    res.status(500).json({ message: 'Öğrenciler getirme hatası', error: error.message });
  }
});

router.get('/all-teachers', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      teachers: teachers.map(t => ({
        id: t._id,
        studentId: t.studentId,
        name: t.name,
        class: t.class,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    console.error('Öğretmenler getirme hatası:', error);
    res.status(500).json({ message: 'Öğretmenler getirme hatası', error: error.message });
  }
});

router.get('/banned-students', async (req, res) => {
  try {
    const bannedStudents = await User.find({ isBanned: true }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      bannedStudents: bannedStudents.map(s => ({
        id: s._id,
        studentId: s.studentId,
        name: s.name,
        class: s.class,
        banReason: s.banReason,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('Yasaklı öğrenciler getirme hatası:', error);
    res.status(500).json({ message: 'Yasaklı öğrenciler getirme hatası', error: error.message });
  }
});

router.get('/all-approved-words', async (req, res) => {
  try {
    const allApprovedWords = await Word.find({ status: 'approved' }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      words: allApprovedWords
    });
  } catch (error) {
    res.status(500).json({ message: 'Kelimeler getirme hatası', error: error.message });
  }
});

router.get('/pending-words', async (req, res) => {
  try {
    const pendingWords = await Word.find({ status: 'pending' }).sort({ createdAt: -1 });
    const pendingSentences = await Word.find({ 
      sentenceStatus: 'pending', 
      sentence: { $ne: "" } 
    }).sort({ createdAt: -1 });
    
    // AI validasyon bilgisini ekle
    const wordsWithValidation = pendingWords.map(word => {
      const wordObj = word.toObject();
      wordObj.aiDecision = word.aiValidation?.wordDecision || 'PENDING';
      wordObj.aiScore = word.aiValidation?.wordScore || 0;
      wordObj.aiReason = word.aiValidation?.wordReason || '';
      wordObj.aiValidated = word.aiValidation?.wordValidated || false;
      wordObj.aiAIBased = word.aiValidation?.wordAIBased || false;
      return wordObj;
    });

    const sentencesWithValidation = pendingSentences.map(word => {
      const wordObj = word.toObject();
      wordObj.aiDecision = word.aiValidation?.sentenceDecision || 'PENDING';
      wordObj.aiScore = word.aiValidation?.sentenceScore || 0;
      wordObj.aiReason = word.aiValidation?.sentenceReason || '';
      wordObj.aiValidated = word.aiValidation?.sentenceValidated || false;
      wordObj.aiAIBased = word.aiValidation?.sentenceAIBased || false;
      return wordObj;
    });
    
    res.json({
      success: true,
      pendingWords: wordsWithValidation,
      pendingSentences: sentencesWithValidation
    });
  } catch (error) {
    res.status(500).json({ message: 'Admin verileri getirme hatası', error: error.message });
  }
});

router.post('/word-action', async (req, res) => {
  try {
    const { wordId, action } = req.body;

    const word = await Word.findById(wordId);
    if (!word) {
      return res.status(404).json({ message: 'Kelime bulunamadı' });
    }

    if (action === 'approve') {
      word.status = 'approved';
      
      const user = await User.findOne({ studentId: word.studentId });
      if (user) {
        user.points += word.points;
        await user.save();
      }
      
      await word.save();
      
      res.json({
        success: true,
        message: `Kelime onaylandı! Öğrenciye +${word.points} puan verildi.`,
        word
      });
    } else if (action === 'reject') {
      word.status = 'rejected';
      await word.save();
      
      res.json({
        success: true,
        message: 'Kelime reddedildi.',
        word
      });
    }
  } catch (error) {
    console.error('Kelime onay/red hatası:', error);
    res.status(500).json({ message: 'İşlem hatası', error: error.message });
  }
});

router.post('/sentence-action', async (req, res) => {
  try {
    const { wordId, action } = req.body;

    const word = await Word.findById(wordId);
    if (!word) {
      return res.status(404).json({ message: 'Kelime bulunamadı' });
    }

    if (action === 'approve') {
      word.sentenceStatus = 'approved';
      
      const user = await User.findOne({ studentId: word.sentenceStudentId });
      if (user) {
        user.points += word.sentencePoints;
        await user.save();
      }
      
      await word.save();
      
      res.json({
        success: true,
        message: `Cümle onaylandı! Öğrenciye +${word.sentencePoints} puan verildi.`,
        word
      });
    } else if (action === 'reject') {
      word.sentenceStatus = 'rejected';
      word.sentence = '';
      word.sentenceStudentId = '';
      word.sentenceLanguage = '';
      await word.save();
      
      res.json({
        success: true,
        message: 'Cümle reddedildi.',
        word
      });
    }
  } catch (error) {
    console.error('Cümle onay/red hatası:', error);
    res.status(500).json({ message: 'İşlem hatası', error: error.message });
  }
});

router.post('/delete-word', async (req, res) => {
  try {
    const { wordId } = req.body;

    const word = await Word.findByIdAndDelete(wordId);
    if (!word) {
      return res.status(404).json({ message: 'Kelime bulunamadı' });
    }

    res.json({
      success: true,
      message: '🗑️ Kelime başarıyla silindi'
    });
  } catch (error) {
    console.error('Kelime silme hatası:', error);
    res.status(500).json({ message: 'Silme işlemi hatası', error: error.message });
  }
});

router.post('/delete-sentence', async (req, res) => {
  try {
    const { wordId } = req.body;

    const word = await Word.findById(wordId);
    if (!word) {
      return res.status(404).json({ message: 'Kelime bulunamadı' });
    }

    word.sentence = '';
    word.sentenceStatus = 'pending';
    word.sentenceStudentId = '';
    word.sentenceLanguage = '';
    word.sentencePoints = 0;
    
    await word.save();

    res.json({
      success: true,
      message: '🗑️ Cümle başarıyla silindi'
    });
  } catch (error) {
    console.error('Cümle silme hatası:', error);
    res.status(500).json({ message: 'Silme işlemi hatası', error: error.message });
  }
});

// ✅ GELİŞMİŞ ARAMA - Öğrenci adı, sınıf, ID'ye göre filtreleme
router.get('/search-students', async (req, res) => {
  try {
    const { query, class: studentClass, searchType = 'all' } = req.query;
    let filter = { role: 'student' };

    if (searchType === 'name' || searchType === 'all') {
      filter.$or = [{ name: { $regex: query, $options: 'i' } }];
    }
    if (searchType === 'id' || searchType === 'all') {
      filter.$or = filter.$or || [];
      filter.$or.push({ studentId: { $regex: query, $options: 'i' } });
    }
    if (studentClass) {
      filter.class = studentClass;
    }

    const students = await User.find(filter).sort({ points: -1 }).limit(50);
    
    res.json({
      success: true,
      students: students.map(s => ({
        id: s._id,
        studentId: s.studentId,
        name: s.name,
        class: s.class,
        points: s.points,
        isBanned: s.isBanned,
        lastLogin: s.lastLogin,
        gamesPlayed: s.gamesPlayed
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Arama hatası', error: error.message });
  }
});

// ✅ DUYURU POSTLama
router.post('/announcement', async (req, res) => {
  try {
    const { title, content, type, priority, adminId, adminName } = req.body;

    const announcement = new Announcement({
      title,
      content,
      type,
      priority,
      adminId,
      adminName,
      targetAudience: 'all'
    });

    await announcement.save();
    await logAdminAction(adminId, adminName, 'announcement_post', null, null, `Duyuru: ${title}`);

    res.json({
      success: true,
      message: 'Duyuru başarıyla paylaşıldı!',
      announcement
    });
  } catch (error) {
    res.status(500).json({ message: 'Duyuru paylaşma hatası', error: error.message });
  }
});

// ✅ DUYURUları AL
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ priority: -1, createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      announcements
    });
  } catch (error) {
    res.status(500).json({ message: 'Duyurular getirme hatası', error: error.message });
  }
});

// ✅ DUYURU SİL
router.post('/delete-announcement', async (req, res) => {
  try {
    const { announcementId, adminId, adminName } = req.body;

    if (!announcementId) {
      return res.status(400).json({ message: 'Duyuru ID zorunludur' });
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı' });
    }

    await Announcement.findByIdAndDelete(announcementId);
    await logAdminAction(adminId, adminName, 'announcement_delete', announcementId, announcement.title, `Duyuru silindi: ${announcement.title}`);

    res.json({
      success: true,
      message: 'Duyuru başarıyla silindi'
    });
  } catch (error) {
    console.error('Duyuru silme hatası:', error);
    res.status(500).json({ message: 'Duyuru silme hatası', error: error.message });
  }
});

// ✅ ADMIN LOG'LARı AL
router.get('/logs', async (req, res) => {
  try {
    const { limit = 50, skip = 0, action = null } = req.query;
    let filter = {};
    if (action) filter.action = action;

    const logs = await AdminLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await AdminLog.countDocuments(filter);

    res.json({
      success: true,
      logs,
      total,
      page: Math.ceil(parseInt(skip) / parseInt(limit)) + 1
    });
  } catch (error) {
    res.status(500).json({ message: 'Log getirme hatası', error: error.message });
  }
});

// ✅ OYUN İSTATİSTİKLERİ
router.get('/game-statistics', async (req, res) => {
  try {
    const { gameType = null, limit = 20 } = req.query;
    let filter = {};
    if (gameType) filter.gameType = gameType;

    const stats = await GameStatistics.find(filter)
      .sort({ pointsEarned: -1, date: -1 })
      .limit(parseInt(limit));

    const totalPlayers = await GameStatistics.distinct('studentId', filter);
    const totalGames = await GameStatistics.countDocuments(filter);

    const gameStats = {
      flashcard: await GameStatistics.countDocuments({ gameType: 'flashcard' }),
      matching: await GameStatistics.countDocuments({ gameType: 'matching' })
    };

    res.json({
      success: true,
      statistics: stats,
      summary: {
        totalPlayers: totalPlayers.length,
        totalGames,
        gameStats,
        averageAccuracy: stats.length > 0 
          ? (stats.reduce((acc, s) => acc + s.accuracy, 0) / stats.length).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'İstatistik getirme hatası', error: error.message });
  }
});

// ✅ ÖĞRENCİ İLERLEME TAKIBI - Günlük/Haftalık Puan Artışı
router.get('/student-progress/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const user = await User.findOne({ studentId });

    if (!user) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    const history = await PointsHistory.find({ studentId })
      .sort({ date: -1 })
      .limit(100);

    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const weeklyData = history.filter(h => h.date >= sevenDaysAgo);

    const dailyPoints = {};
    weeklyData.forEach(h => {
      const date = h.date.toISOString().split('T')[0];
      dailyPoints[date] = (dailyPoints[date] || 0) + h.pointsEarned;
    });

    res.json({
      success: true,
      student: {
        name: user.name,
        studentId: user.studentId,
        class: user.class,
        totalPoints: user.points,
        lastLogin: user.lastLogin,
        gamesPlayed: user.gamesPlayed,
        totalGameTime: user.totalGameTime
      },
      dailyPoints,
      recentHistory: history.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ message: 'İlerleme getirme hatası', error: error.message });
  }
});

// ✅ OYUN İSTATİSTİKLERİ - Toplam oyun sayısı, oyuncu sayısı vb.
router.get('/game-statistics', async (req, res) => {
  try {
    const playedStudents = await User.countDocuments({ gamesPlayed: { $gt: 0 } });
    const totalGamesPlayed = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$gamesPlayed' }
        }
      }
    ]);

    const totalGames = totalGamesPlayed[0]?.total || 0;

    const gameStats = await GameStatistics.aggregate([
      {
        $group: {
          _id: '$gameType',
          count: { $sum: 1 },
          avgAccuracy: { $avg: '$accuracy' }
        }
      }
    ]);

    const gameTypeCounts = {};
    let overallAccuracy = 0;
    let totalAccuracyPoints = 0;

    gameStats.forEach(stat => {
      gameTypeCounts[stat._id] = stat.count;
      overallAccuracy += (stat.avgAccuracy || 0);
      totalAccuracyPoints += 1;
    });

    const avgAccuracy = totalAccuracyPoints > 0 ? Math.round(overallAccuracy / totalAccuracyPoints) : 0;

    res.json({
      success: true,
      summary: {
        totalPlayers: playedStudents,
        totalGames: totalGames,
        gameStats: {
          flashcard: gameTypeCounts['flashcard'] || 0,
          matching: gameTypeCounts['matching'] || 0
        },
        averageAccuracy: avgAccuracy
      }
    });
  } catch (error) {
    console.error('Oyun istatistikleri hatası:', error);
    res.status(500).json({ message: 'Oyun istatistikleri hatası', error: error.message });
  }
});

// ✅ TÜM ÖĞRENCILERIN HAFTALIK PUAN ARTIŞI
router.get('/weekly-statistics', async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const topStudents = await PointsHistory.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: '$studentId',
          studentName: { $first: '$studentName' },
          studentClass: { $first: '$studentClass' },
          totalPointsEarned: { $sum: '$pointsEarned' },
          actionCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalPointsEarned: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.json({
      success: true,
      topStudents,
      period: {
        from: sevenDaysAgo.toISOString(),
        to: now.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Haftalık istatistik hatası', error: error.message });
  }
});

// ✅ TÜM ÖĞRENCİLERİN PUANLARINI SİL
router.post('/reset-all-points', async (req, res) => {
  try {
    const result = await User.updateMany(
      { role: 'student' },
      { $set: { points: 0, gamesPlayed: 0 } }
    );

    await PointsHistory.deleteMany({});
    await GameStatistics.deleteMany({});

    res.json({
      success: true,
      message: `${result.modifiedCount} öğrencinin puanları sıfırlandı!`,
      resetCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Puan sıfırlama hatası:', error);
    res.status(500).json({ message: 'Puan sıfırlama hatası', error: error.message });
  }
});

// ✅ GÜNLÜK SERİLERİ SIFIRLA
router.post('/reset-daily-streaks', async (req, res) => {
  try {
    const result = await User.updateMany(
      { role: 'student' },
      { $set: { dailyStreak: 0, lastLoginDate: null } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} öğrencinin günlük serileri sıfırlandı!`,
      resetCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Seri sıfırlama hatası:', error);
    res.status(500).json({ message: 'Seri sıfırlama hatası', error: error.message });
  }
});

module.exports = router;
