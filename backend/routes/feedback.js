const express = require('express');
const Feedback = require('../models/Feedback');
const router = express.Router();

// ✅ FEEDBACK GÖNDER
router.post('/send', async (req, res) => {
  try {
    const { studentId, studentName, studentClass, message, type } = req.body;

    if (!studentId || !message) {
      return res.status(400).json({ message: 'Öğrenci ID ve mesaj zorunludur' });
    }

    const feedback = new Feedback({
      studentId,
      studentName,
      studentClass,
      message,
      type: type || 'suggestion'
    });

    await feedback.save();

    res.json({
      success: true,
      message: '✅ Geri bildiriminiz başarıyla gönderildi!',
      feedback
    });
  } catch (error) {
    console.error('Feedback gönderme hatası:', error);
    res.status(500).json({ message: 'Feedback gönderme hatası', error: error.message });
  }
});

// ✅ ÖĞRENCİ KENDİ FEEDBACK'LERİNİ GÖRÜNTÜLE
router.get('/my-feedbacks/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const feedbacks = await Feedback.find({ studentId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      feedbacks,
      unreadCount: feedbacks.filter(f => !f.studentRead && f.adminReply).length
    });
  } catch (error) {
    console.error('Feedback getirme hatası:', error);
    res.status(500).json({ message: 'Feedback getirme hatası', error: error.message });
  }
});

// ✅ ÖĞRENCİ ADMIN CEVABINI OKU
router.post('/mark-read/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { studentRead: true },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback bulunamadı' });
    }

    res.json({
      success: true,
      message: 'Okundu olarak işaretlendi',
      feedback
    });
  } catch (error) {
    console.error('Feedback okundu işaretleme hatası:', error);
    res.status(500).json({ message: 'İşlem hatası', error: error.message });
  }
});

// ✅ ADMİN - TÜM FEEDBACK'LERİ GÖRÜNTÜLE
router.get('/admin/all', async (req, res) => {
  try {
    const { status = null, limit = 50, skip = 0 } = req.query;
    let filter = {};
    
    if (status) filter.status = status;

    const feedbacks = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(filter);

    const stats = {
      pending: await Feedback.countDocuments({ status: 'pending' }),
      answered: await Feedback.countDocuments({ status: 'answered' }),
      closed: await Feedback.countDocuments({ status: 'closed' })
    };

    res.json({
      success: true,
      feedbacks,
      total,
      stats,
      page: Math.ceil(parseInt(skip) / parseInt(limit)) + 1
    });
  } catch (error) {
    console.error('Admin feedback getirme hatası:', error);
    res.status(500).json({ message: 'Feedback getirme hatası', error: error.message });
  }
});

// ✅ ADMİN - FEEDBACK'E CEVAP VER
router.post('/admin/reply', async (req, res) => {
  try {
    const { feedbackId, adminId, adminName, message } = req.body;

    if (!feedbackId || !message) {
      return res.status(400).json({ message: 'Feedback ID ve cevap zorunludur' });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      {
        adminReply: {
          adminId,
          adminName,
          message,
          repliedAt: new Date()
        },
        status: 'answered',
        studentRead: false
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback bulunamadı' });
    }

    res.json({
      success: true,
      message: '✅ Cevap başarıyla gönderildi!',
      feedback
    });
  } catch (error) {
    console.error('Feedback cevap hatası:', error);
    res.status(500).json({ message: 'Cevap gönderme hatası', error: error.message });
  }
});

// ✅ ADMİN - FEEDBACK KAPAT
router.post('/admin/close/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { status: 'closed' },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback bulunamadı' });
    }

    res.json({
      success: true,
      message: 'Feedback kapatıldı',
      feedback
    });
  } catch (error) {
    console.error('Feedback kapatma hatası:', error);
    res.status(500).json({ message: 'Kapatma hatası', error: error.message });
  }
});

// ✅ ADMİN - FEEDBACK SİL
router.post('/admin/delete/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback bulunamadı' });
    }

    res.json({
      success: true,
      message: 'Feedback silindi'
    });
  } catch (error) {
    console.error('Feedback silme hatası:', error);
    res.status(500).json({ message: 'Silme hatası', error: error.message });
  }
});

module.exports = router;
