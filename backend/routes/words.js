const express = require('express');
const axios = require('axios');
const Word = require('../models/Word');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const { validateWord, validateSentence } = require('../services/aiValidator');
const router = express.Router();

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

function getCurrentBadge(points) {
  let currentBadge = null;
  for (let i = BADGE_LEVELS.length - 1; i >= 0; i--) {
    if (points >= BADGE_LEVELS[i].points) {
      currentBadge = BADGE_LEVELS[i];
      break;
    }
  }
  return currentBadge;
}

function getNextBadge(points) {
  for (let badge of BADGE_LEVELS) {
    if (points < badge.points) {
      return badge;
    }
  }
  return null;
}

// Kelime ekle - AI Validasyonla
router.post('/add', async (req, res) => {
  try {
    const { word, meaning, language, studentId } = req.body;

    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    const pointsMap = {'turkish': 10, 'english': 25, 'arabic': 50};
    const wordPoints = pointsMap[language] || 10;

    // AI Validasyon başlat
    console.log('🤖 Kelime AI validasyon başlıyor...');
    const validation = await validateWord(word, meaning, language);

    const newWord = new Word({
      word,
      meaning,
      language,
      studentId,
      studentName: user.name,
      studentClass: user.class,
      points: wordPoints,
      status: validation.decision === 'APPROVE' ? 'approved' : 'pending',
      aiValidation: {
        wordValidated: true,
        wordDecision: validation.decision,
        wordScore: validation.score,
        wordReason: validation.reason,
        wordAIBased: validation.aiValidated || false,
        validatedAt: new Date()
      }
    });

    await newWord.save();

    let statusMsg = '';
    if (validation.decision === 'APPROVE') {
      statusMsg = `✅ Kelime AI tarafından otomatik onaylandı! Hemen +${wordPoints} puan alacaksınız.`;
      if (user.points !== undefined) {
        user.points += wordPoints;
        await user.save();
      }
    } else {
      statusMsg = `⏳ Kelime admin onayı için gönderildi. (AI Karar: ${validation.reason})`;
    }

    res.json({
      success: true,
      message: statusMsg,
      word: newWord,
      validation: {
        decision: validation.decision,
        score: validation.score,
        reason: validation.reason,
        aiValidated: validation.aiValidated
      },
      newPoints: user.points
    });

  } catch (error) {
    console.error('Kelime ekleme hatası:', error);
    res.status(500).json({ message: 'Kelime ekleme hatası', error: error.message });
  }
});

// Tüm kelimeleri getir - SADECE ONAYLANMIŞ KELİMELER ve CÜMLELER
router.get('/all', async (req, res) => {
  try {
    const words = await Word.find({ status: 'approved' }).sort({ createdAt: -1 });
    
    const filteredWords = words.map(word => {
      const wordObj = word.toObject();
      if (wordObj.sentenceStatus !== 'approved') {
        wordObj.sentence = '';
        wordObj.sentenceStatus = '';
        wordObj.sentenceLanguage = '';
      }
      return wordObj;
    });
    
    res.json({ success: true, words: filteredWords });
  } catch (error) {
    res.status(500).json({ message: 'Kelimeleri getirme hatası', error: error.message });
  }
});

// Kelime ara
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    let words;
    if (q && q.trim() !== '') {
      words = await Word.find({
        status: 'approved',
        $or: [
          { word: { $regex: q, $options: 'i' } },
          { meaning: { $regex: q, $options: 'i' } }
        ]
      }).sort({ createdAt: -1 });
    } else {
      words = await Word.find({ status: 'approved' }).sort({ createdAt: -1 });
    }

    const filteredWords = words.map(word => {
      const wordObj = word.toObject();
      if (wordObj.sentenceStatus !== 'approved') {
        wordObj.sentence = '';
        wordObj.sentenceStatus = '';
        wordObj.sentenceLanguage = '';
      }
      return wordObj;
    });

    res.json({ success: true, words: filteredWords });
  } catch (error) {
    res.status(500).json({ message: 'Arama hatası', error: error.message });
  }
});

// Like/Dislike
router.post('/vote', async (req, res) => {
  try {
    const { wordId, type, studentId } = req.body;

    const word = await Word.findById(wordId);
    if (!word) {
      return res.status(404).json({ message: 'Kelime bulunamadı' });
    }

    if (word.status !== 'approved') {
      return res.status(400).json({ message: 'Bu kelime henüz onaylanmamış' });
    }

    if (!word.votedUsers) {
      word.votedUsers = [];
    }

    const existingVote = word.votedUsers.find(vote => vote.studentId === studentId);
    
    if (existingVote) {
      if (existingVote.voteType === type) {
        return res.json({
          success: false,
          message: 'Bu kelimeye zaten oy vermişsiniz!'
        });
      }
      
      if (existingVote.voteType === 'like') {
        word.likes = Math.max(0, word.likes - 1);
      } else {
        word.dislikes = Math.max(0, word.dislikes - 1);
      }
      
      word.votedUsers = word.votedUsers.filter(vote => vote.studentId !== studentId);
    }

    if (type === 'like') {
      word.likes += 1;
    } else {
      word.dislikes += 1;
    }

    word.votedUsers.push({
      studentId: studentId,
      voteType: type,
      votedAt: new Date()
    });

    await word.save();

    const user = await User.findOne({ studentId });
    let pointsAdded = 0;
    
    if (user && !existingVote) {
      user.points += 1;
      pointsAdded = 1;
      await user.save();
    }

    res.json({
      success: true,
      message: existingVote ? 'Oyunuz güncellendi!' : `Oy verildi! +${pointsAdded} puan`,
      word,
      newPoints: user ? user.points : 0
    });

  } catch (error) {
    console.error('Oy verme hatası:', error);
    res.status(500).json({ message: 'Oy verme hatası', error: error.message });
  }
});

// Cümle ekleme - AI Validasyonla
router.post('/add-sentence', async (req, res) => {
  try {
    const { wordId, sentence, studentId, sentenceLanguage } = req.body;

    const word = await Word.findById(wordId);
    if (!word) {
      return res.status(404).json({ message: 'Kelime bulunamadı' });
    }

    if (word.status !== 'approved') {
      return res.status(400).json({ message: 'Bu kelime henüz onaylanmamış' });
    }

    if (word.sentence && word.sentenceStatus === 'approved') {
      return res.status(400).json({ 
        message: 'Bu kelimeye zaten onaylanmış bir cümle eklenmiş. Başka cümle eklenemez!' 
      });
    }

    const pointsMap = {'turkish': 5, 'english': 7, 'arabic': 10};
    const sentencePoints = pointsMap[sentenceLanguage] || 5;

    // AI Validasyon başlat
    console.log('🤖 Cümle AI validasyon başlıyor...');
    const validation = await validateSentence(sentence, sentenceLanguage);

    word.sentence = sentence;
    word.sentenceStudentId = studentId;
    word.sentenceLanguage = sentenceLanguage;
    word.sentencePoints = sentencePoints;
    word.sentenceStatus = validation.decision === 'APPROVE' ? 'approved' : 'pending';
    word.aiValidation = word.aiValidation || {};
    word.aiValidation.sentenceValidated = true;
    word.aiValidation.sentenceDecision = validation.decision;
    word.aiValidation.sentenceScore = validation.score;
    word.aiValidation.sentenceReason = validation.reason;
    word.aiValidation.sentenceAIBased = validation.aiValidated || false;
    word.aiValidation.validatedAt = new Date();

    await word.save();

    let statusMsg = '';
    if (validation.decision === 'APPROVE') {
      statusMsg = `✅ Cümle AI tarafından otomatik onaylandı! Hemen +${sentencePoints} puan alacaksınız.`;
      const user = await User.findOne({ studentId });
      if (user) {
        user.points += sentencePoints;
        await user.save();
      }
    } else {
      statusMsg = `⏳ Cümle admin onayı için gönderildi. (AI Karar: ${validation.reason})`;
    }

    res.json({
      success: true,
      message: statusMsg,
      word,
      validation: {
        decision: validation.decision,
        score: validation.score,
        reason: validation.reason,
        aiValidated: validation.aiValidated
      }
    });

  } catch (error) {
    console.error('Cümle ekleme hatası:', error);
    res.status(500).json({ message: 'Cümle ekleme hatası', error: error.message });
  }
});

// Öğrenci için duyuruları getir
router.get('/announcements', async (req, res) => {
  try {
    const { studentId } = req.query;
    
    const announcements = await Announcement.find({ 
      isActive: true,
      $or: [
        { targetAudience: 'all' },
        { targetStudentId: studentId }
      ]
    })
    .sort({ priority: -1, createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      announcements
    });
  } catch (error) {
    console.error('Duyurular getirme hatası:', error);
    res.status(500).json({ message: 'Duyurular getirme hatası', error: error.message });
  }
});

// Puan tablosu (Leaderboard)
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 20, period = 'all' } = req.query;

    let students;
    if (period === 'week') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      students = await User.find({ role: 'student', isBanned: false })
        .select('studentId name class points gamesPlayed')
        .sort({ points: -1 })
        .limit(parseInt(limit));
    } else {
      students = await User.find({ role: 'student', isBanned: false })
        .select('studentId name class points gamesPlayed')
        .sort({ points: -1 })
        .limit(parseInt(limit));
    }

    const leaderboard = students.map((student, index) => ({
      rank: index + 1,
      studentId: student.studentId,
      name: student.name,
      class: student.class,
      points: student.points,
      gamesPlayed: student.gamesPlayed || 0,
      medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1
    }));

    res.json({
      success: true,
      leaderboard,
      totalCount: students.length
    });
  } catch (error) {
    console.error('Leaderboard getirme hatası:', error);
    res.status(500).json({ message: 'Leaderboard getirme hatası', error: error.message });
  }
});

// Oyun puan kayıt
router.post('/save-game-points', async (req, res) => {
  try {
    const { studentId, points, gameType } = req.body;

    if (!studentId || points === undefined) {
      return res.status(400).json({ message: 'Öğrenci ID ve puan gerekli' });
    }

    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    user.points += parseInt(points);
    user.gamesPlayed = (user.gamesPlayed || 0) + 1;
    await user.save();

    res.json({
      success: true,
      message: `${points} puan kaydedildi!`,
      newPoints: user.points,
      gamesPlayed: user.gamesPlayed
    });
  } catch (error) {
    console.error('Oyun puan kayıt hatası:', error);
    res.status(500).json({ message: 'Oyun puan kayıt hatası', error: error.message });
  }
});

// Öğrenci istatistikleri
router.get('/student-stats/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    const words = await Word.countDocuments({ studentId, status: 'approved' });
    const sentences = await Word.countDocuments({ sentenceStudentId: studentId, sentenceStatus: 'approved' });
    const rank = await User.countDocuments({ role: 'student', points: { $gt: student.points }, isBanned: false }) + 1;
    const currentBadge = getCurrentBadge(student.points);
    const nextBadge = getNextBadge(student.points);

    res.json({
      success: true,
      stats: {
        name: student.name,
        class: student.class,
        points: student.points,
        approvedWords: words,
        approvedSentences: sentences,
        gamesPlayed: student.gamesPlayed || 0,
        rank,
        avatar: student.avatar,
        badge: currentBadge,
        nextBadge: nextBadge
      }
    });
  } catch (error) {
    console.error('Öğrenci istatistikleri hatası:', error);
    res.status(500).json({ message: 'Öğrenci istatistikleri hatası', error: error.message });
  }
});

router.get('/ai-suggestions/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Öğrenci bulunamadı' });
    }

    const stats = await Word.aggregate([
      { $match: { studentId } },
      { $group: {
        _id: null,
        approvedWords: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        pendingWords: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        rejectedWords: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        approvedSentences: { $sum: { $cond: [{ $eq: ['$sentenceStatus', 'approved'] }, 1, 0] } }
      }}
    ]);

    const gamesPlayed = student.gamesPlayed || 0;
    const approvedWords = stats[0]?.approvedWords || 0;
    const pendingWords = stats[0]?.pendingWords || 0;
    const approvedSentences = stats[0]?.approvedSentences || 0;

    const prompt = `Sen WordMaster uygulamasının kişiselleştirilmiş AI danışmanısın. Öğrenci profiline bakarak 2-3 tane kısa, motive edici ve yapıcı öneride bulun.

👤 ÖĞRENCI PROFİLİ:
- ✅ Onaylanan Kelime: ${approvedWords}
- ⏳ Beklemede Kelime: ${pendingWords}
- 📝 Onaylanan Cümle: ${approvedSentences}
- 🎮 Oynanan Oyun Sayısı: ${gamesPlayed}
- 🏆 Toplam Puan: ${student.points}

📋 KURALLAR:
- Türkçe ve teşvik edici ton kullan
- Her öneride öğrenciye uygun bilgiler ver
- Başlık maksimum 30 karakter
- Açıklama 1-2 cümle, yapıcı ve motive edici
- Type: warning (sarı, acil uyarı), info (mavi, tavsiye), success (yeşil, tebrik)
- Icon: ilgili emoji
- Action: kelimeEkle, oyunlar, devamEt

ÇIKTI FORMATI (SADECE JSON):
[
  {"title":"başlık1","description":"açıklama1","type":"warning","icon":"📚","action":"kelimeEkle"},
  {"title":"başlık2","description":"açıklama2","type":"info","icon":"🎮","action":"oyunlar"}
]`;

    let suggestions = [];
    try {
      console.log('HF API çağrısı başlanıyor:', studentId);
      const hfResponse = await axios.post(
        'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
        { inputs: prompt, parameters: { max_new_tokens: 300 } },
        {
          headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
          timeout: 30000
        }
      );
      console.log('✅ HF API yanıt alındı');

      if (hfResponse.data && hfResponse.data[0]?.generated_text) {
        const text = hfResponse.data[0].generated_text;
        console.log('Üretilen metin uzunluğu:', text.length);
        const jsonMatch = text.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('✅ Ayrıştırılan önerileri sayısı:', Array.isArray(parsed) ? parsed.length : 0);
            if (Array.isArray(parsed) && parsed.length > 0) {
              suggestions = parsed.slice(0, 3);
              console.log('🤖 HF AI önerileri başarıyla kullanıldı!');
            } else {
              console.log('⚠️ JSON dizisi boş, fallback kullanılıyor');
              suggestions = getDefaultSuggestions(approvedWords, gamesPlayed);
            }
          } catch (e) {
            console.log('❌ JSON parse hatası:', e.message);
            suggestions = getDefaultSuggestions(approvedWords, gamesPlayed);
          }
        } else {
          console.log('⚠️ JSON regex eşleşmesi bulunamadı, fallback kullanılıyor');
          suggestions = getDefaultSuggestions(approvedWords, gamesPlayed);
        }
      } else {
        console.log('⚠️ HF API yanıt yapısı beklenmediği gibi, fallback kullanılıyor');
        suggestions = getDefaultSuggestions(approvedWords, gamesPlayed);
      }
    } catch (hfError) {
      console.log('❌ HF API çağrı hatası (fallback kullanılacak):', hfError.code, hfError.message);
      suggestions = getDefaultSuggestions(approvedWords, gamesPlayed);
    }

    res.json({ success: true, suggestions: suggestions });
  } catch (error) {
    console.error('AI önerileri kritik hatası:', error);
    res.json({ success: true, suggestions: getDefaultSuggestions(0, 0) });
  }
});

function getDefaultSuggestions(words, games) {
  const suggestions = [];
  
  if (words === 0) {
    suggestions.push({
      icon: '📚',
      title: 'Kelime Ekle',
      description: 'Henüz kelime deposu oluşturmadın. Türkçe, İngilizce ve Arapça kelimeler ekleyerek zengin bir öğrenme havuzu oluştur!',
      type: 'warning',
      action: 'kelimeEkle'
    });
  }
  
  if (games === 0 && words > 0) {
    suggestions.push({
      icon: '🎮',
      title: 'Oyunlarla Öğren',
      description: 'Eklediğin kelimelerle oyunlar oyna! Eşleştirme, Quiz ve Boşluk Doldurma oyunları seni çok daha hızlı öğrenmeye yardımcı olacak.',
      type: 'warning',
      action: 'oyunlar'
    });
  }
  
  if (words > 0 && words < 10 && games >= 0) {
    suggestions.push({
      icon: '🌟',
      title: 'Daha Fazla Kelime Ekle',
      description: `Şu ana kadar ${words} kelime eklemişsin. Kelime sayısını arttırarak öğrenme potansiyelini maksimuma çıkar!`,
      type: 'info',
      action: 'kelimeEkle'
    });
  }
  
  if (words > 0 && games > 0) {
    suggestions.push({
      icon: '✨',
      title: 'Harika İlerleme Gösteriyor!',
      description: 'Hem kelime eklemişsin hem oyun oynamışsın! Düzenli çalışmaya devam ederek başarıya ulaşacaksın. Seni gururla izliyoruz!',
      type: 'success',
      action: 'devamEt'
    });
  }
  
  if (words > 10 && games > 5) {
    suggestions.push({
      icon: '🚀',
      title: 'İleri Seviyelere Doğru',
      description: 'Harika bir temel oluşturdun! Daha zorlayıcı oyunları dene veya yeni diller ekleyerek horizonunu geniş aç.',
      type: 'info',
      action: 'oyunlar'
    });
  }
  
  if (suggestions.length === 0) {
    suggestions.push({
      icon: '🎯',
      title: 'Hedefine Doğru',
      description: 'Sistem başlamaya hazır! İlk adımını atarak bu kelimeleri öğrenme macerasına başla. Seni ne bekliyor?',
      type: 'info',
      action: 'kelimeEkle'
    });
  }
  
  return suggestions;
}

router.put('/change-avatar/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ success: false, message: 'Avatar seçilmedi' });
    }

    const student = await User.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Öğrenci bulunamadı' });
    }

    student.avatar = avatar;
    await student.save();

    res.json({ success: true, message: 'Avatar başarıyla güncellendi', avatar: student.avatar });
  } catch (error) {
    console.error('Avatar değişikliği hatası:', error);
    res.status(500).json({ success: false, message: 'Avatar değişikliği hatası', error: error.message });
  }
});

module.exports = router;