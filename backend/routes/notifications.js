const express = require('express');
const Notification = require('../models/Notification');
const router = express.Router();

// ✅ KULLANICI BİLDİRİMLERİNİ GETİR
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.json({
        success: true,
        notifications: [],
        unreadCount: 0
      });
    }
    
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
      
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Bildirim getirme hatası:', error);
    res.status(500).json({ message: 'Bildirimler alınamadı', error: error.message });
  }
});

// ✅ BİLDİRİMİ OKUNDU OLARAK İŞARETLE
router.post('/mark-read/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Bildirim bulunamadı' });
    }

    res.json({
      success: true,
      message: 'Bildirim okundu',
      notification
    });
  } catch (error) {
    console.error('Bildirim güncelleme hatası:', error);
    res.status(500).json({ message: 'İşlem başarısız', error: error.message });
  }
});

// ✅ TÜMÜNÜ OKUNDU İŞARETLE
router.post('/mark-all-read/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'Tüm bildirimler okundu'
    });
  } catch (error) {
    console.error('Toplu güncelleme hatası:', error);
    res.status(500).json({ message: 'İşlem başarısız', error: error.message });
  }
});

// ✅ BİLDİRİM SİL
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await Notification.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Bildirim silindi'
    });
  } catch (error) {
    console.error('Bildirim silme hatası:', error);
    res.status(500).json({ message: 'Silme başarısız', error: error.message });
  }
});

module.exports = router;
