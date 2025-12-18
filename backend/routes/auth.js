const express = require('express');
const User = require('../models/User');
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

// Basit login endpoint
router.post('/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;

    console.log('Login denemesi:', studentId);

    // Kullanıcıyı bul
    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(401).json({ message: 'Öğrenci bulunamadı' });
    }

    // Ban kontrolü
    if (user.isBanned) {
      return res.status(403).json({ message: 'Siteden atıldınız. Lütfen ilgili yöneticiye danışınız.' });
    }

    // Şifre kontrolü - hash'lenmiş veya plain text
    let passwordMatch = false;
    
    if (user.password.startsWith('$2')) {
      // Bcrypt hash'lenmiş şifre
      passwordMatch = await user.correctPassword(password, user.password);
    } else {
      // Plain text şifre (eski veriler)
      passwordMatch = password === user.password;
      
      // Plain text'i hash'le ve kaydet
      if (passwordMatch) {
        try {
          const bcrypt = require('bcryptjs');
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(password, salt);
          user.isModified('password');
        } catch (e) {
          console.log('Password rehash hatası:', e.message);
        }
      }
    }
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Yanlış şifre' });
    }

    // Günlük seri hesaplama
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streakBonus = 0;
    
    console.log('--- STREAK CALCULATION START ---');
    console.log('User ID:', user.studentId);
    console.log('Current dailyStreak:', user.dailyStreak, 'Type:', typeof user.dailyStreak);
    console.log('streakLastDate:', user.streakLastDate);
    console.log('Today:', today);
    
    if (user.streakLastDate) {
      const lastDate = new Date(user.streakLastDate);
      lastDate.setHours(0, 0, 0, 0);
      console.log('Last Date (normalized):', lastDate);
      
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      console.log('Days Diff:', daysDiff);
      
      if (daysDiff === 1) {
        user.dailyStreak = (user.dailyStreak || 0) + 1;
        streakBonus = user.dailyStreak * 50;
        console.log('Consecutive login. New streak:', user.dailyStreak, 'Bonus:', streakBonus);
      } else if (daysDiff > 1) {
        user.dailyStreak = 1;
        streakBonus = 50;
        console.log('Streak broken. Reset to 1. Bonus:', streakBonus);
      } else if (daysDiff === 0) {
        streakBonus = 0;
        console.log('Same day login. Bonus: 0');
      } else {
        console.log('Negative days diff? Clock skew?', daysDiff);
      }
    } else {
      user.dailyStreak = 1;
      streakBonus = 50;
      console.log('First streak login. Streak: 1, Bonus: 50');
    }
    
    console.log('Final dailyStreak:', user.dailyStreak);
    console.log('Final streakBonus:', streakBonus);
    
    // Safety check for inconsistent state
    if (streakBonus > 0 && (!user.dailyStreak || user.dailyStreak < 1)) {
      console.warn('Correction: streakBonus > 0 but dailyStreak is invalid. Setting to 1.');
      user.dailyStreak = 1;
    }
    
    if (streakBonus > 0) {
      user.points = (user.points || 0) + streakBonus;
      console.log('Points updated. New points:', user.points);
    }
    
    user.streakLastDate = today;
    user.streakBonusPoints = streakBonus;

    // Last login güncelle
    user.lastLogin = new Date();
    console.log('Saving user...');
    await user.save();
    console.log('User saved.');

    const currentBadge = getCurrentBadge(user.points);
    const nextBadge = getNextBadge(user.points);

    // Başarılı giriş
    res.json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        studentId: user.studentId,
        name: user.name,
        class: user.class,
        isFirstLogin: user.isFirstLogin,
        points: user.points,
        role: user.role,
        avatar: user.avatar,
        badge: currentBadge,
        nextBadge: nextBadge,
        dailyStreak: user.dailyStreak || 0,
        streakBonusPoints: streakBonus
      }
    });

  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Şifre değiştirme
router.post('/change-password', async (req, res) => {
  try {
    const { studentId, newPassword, kvkkApproved } = req.body;

    console.log('Şifre değiştirme:', studentId);

    // Kullanıcıyı bul
    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Yeni şifreyi kaydet
    user.password = newPassword;
    user.isFirstLogin = false;
    
    // KVKK onayını kaydet
    if (kvkkApproved) {
      user.kvkkApproved = true;
      user.kvkkApprovedAt = new Date();
    }
    
    await user.save();

    res.json({ 
      success: true, 
      message: 'Şifre başarıyla güncellendi' 
    });

  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ message: 'Şifre güncelleme hatası', error: error.message });
  }
});

module.exports = router;