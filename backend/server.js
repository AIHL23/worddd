const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ogrenci-sistemi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB bağlantısı başarılı'))
.catch(err => console.log('❌ MongoDB bağlantı hatası:', err));

// Models
const User = require('./models/User');
const Word = require('./models/Word');

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const wordRoutes = require('./routes/words');
const feedbackRoutes = require('./routes/feedback');
const chatRoutes = require('./routes/chat');
const gamesRoutes = require('./routes/games');
const notificationRoutes = require('./routes/notifications');

app.get('/', (req, res) => {
  res.json({ message: 'Sunucu çalışıyor!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/notifications', notificationRoutes);


// STATS ENDPOINT - Platform İstatistikleri
app.get('/api/stats/platform', async (req, res) => {
  try {
    const totalMembers = await User.countDocuments();
    const totalWords = await Word.countDocuments();
    const approvedWords = await Word.countDocuments({ status: 'approved' });
    
    // Bugün aktif olan öğrencileri say (son 24 saat içinde login yapanlar)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeStudents = await User.countDocuments({ 
      lastLogin: { $gte: oneDayAgo } 
    });

    res.json({
      success: true,
      totalMembers,
      totalWords,
      approvedWords,
      activeStudents: Math.max(1, activeStudents)
    });
  } catch (error) {
    console.error('Stats getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Stats getirme hatası', 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`✅ Cümle sistemi: Onaylanmayan cümleler gizli`);
  console.log(`🎯 Cümle puanları: TR: +5, EN: +7, AR: +10`);
});