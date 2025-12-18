const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../models/User');
const ChatHistory = require('../models/ChatHistory');

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

router.post('/admin-ai', async (req, res) => {
  try {
    const { adminId, message } = req.body;
    
    console.log('🤖 Admin AI İstek:', { adminId, message });

    if (!message || message.trim() === '') {
      console.log('❌ Mesaj boş');
      return res.status(400).json({ 
        success: false, 
        message: 'Mesaj boş olamaz' 
      });
    }

    const admin = await User.findOne({ studentId: adminId });
    console.log('👤 Admin bulundu:', admin ? admin.name : 'BULUNAMADI');
    
    if (!admin || admin.role !== 'admin') {
      console.log('❌ Admin yetki kontrol hatası. Role:', admin?.role);
      return res.status(403).json({ 
        success: false, 
        message: 'Sadece admin erişebilir' 
      });
    }

    try {
      console.log('🤖 Gerçek AI ile admin-ai işlemi başlıyor...');
      
      const Announcement = require('../models/Announcement');
      const Word = require('../models/Word');

      const systemPrompt = `Sen WordMaster platformunun Admin AI Asistanısın. Admin tarafından verilen komutları anlayıp ejecute etmelisin.

Yapabileceğin işlemler:
1. Öğrenci listesi göster - "öğrenci listesi", "tüm öğrenciler" gibi komutlarda
2. Puan istatistikleri göster - "puan istatistik", "toplam puan" gibi komutlarda
3. En iyi öğrencileri göster (Top 10) - "en iyi öğrenciler", "en yüksek puanlı" gibi komutlarda
4. Yasaklı öğrencileri listele - "yasaklı öğrenciler", "banlı öğrenciler" gibi komutlarda
5. Sistem istatistikleri göster - "sistem istatistik", "toplam kelime" gibi komutlarda
6. Duyuru oluştur ve paylaş - "duyuru paylaş", "duyuru gönder" gibi komutlarda (AI'nin kendisi duyuru içeriğini yazar)
7. Öğrenciye puan ver - "X'ye Y puan ver" gibi komutlarda
8. Öğrenciye not ekle - "X'ye not ekle: Y" gibi komutlarda
9. Öğrencinin notlarını göster - "X'nin notlarını göster" gibi komutlarda

Admin'in mesajını analiz edip şunlardan birini döndür:
- "list_students" - Öğrenci listesi
- "student_stats" - Puan istatistikleri
- "top_students" - En iyi 10 öğrenci
- "banned_students" - Yasaklı öğrenciler
- "system_stats" - Sistem istatistikleri
- "create_announcement" - Duyuru oluştur (burada AI duyuru yazacak)
- "add_points" - Puan ver
- "add_note" - Not ekle
- "show_notes" - Notları göster
- "chat" - Sadece sohbet

Response formatın şu JSON olmalı:
{
  "action": "action_type",
  "message": "kullanıcıya gösterilecek mesaj",
  "data": {}
}

Eğer "create_announcement" ise data içine:
{
  "title": "duyuru başlığı",
  "content": "duyuru içeriği (AI yazsın)",
  "type": "info"
}

Eğer "add_points" ise data içine:
{
  "studentName": "öğrenci adı",
  "points": "puan sayısı"
}

Eğer "add_note" ise data içine:
{
  "studentName": "öğrenci adı",
  "note": "yazılacak not"
}

Eğer "show_notes" ise data içine:
{
  "studentName": "öğrenci adı"
}

Türkçe ve samimi ol. İnternet üzerinden konuşuyorsun, admin senin komutlarını anlayarak yapacak.`;

      const response = await axios.post(
        'https://router.huggingface.co/v1/chat/completions',
        {
          model: 'deepseek-ai/DeepSeek-V3.2:novita',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000
        }
      );

      console.log('📡 AI Response alındı');
      
      let aiResponse = '';
      if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        aiResponse = response.data.choices[0].message.content || '';
      }

      aiResponse = aiResponse.trim();
      console.log('🔍 AI Cevap:', aiResponse);

      let jsonData = null;
      try {
        jsonData = JSON.parse(aiResponse);
      } catch (e) {
        console.log('⚠️ JSON parse hatası, raw response:', aiResponse);
        return res.json({
          success: true,
          message: aiResponse
        });
      }

      if (!jsonData.action || !jsonData.message) {
        return res.json({
          success: true,
          message: aiResponse
        });
      }

      const action = jsonData.action;
      let reply = jsonData.message;
      let actionResult = null;

      if (action === 'list_students') {
        const students = await User.find({ role: 'student' }).sort({ points: -1 });
        actionResult = {
          type: 'student_list',
          data: students.map(s => ({
            name: s.name,
            studentId: s.studentId,
            class: s.class,
            points: s.points,
            isBanned: s.isBanned
          }))
        };
      }
      else if (action === 'student_stats') {
        const students = await User.find({ role: 'student' });
        const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);
        const avgPoints = students.length > 0 ? Math.round(totalPoints / students.length) : 0;
        reply += `\n\n📊 Ayrıntılı Istatistikler:\n• Toplam Öğrenci: ${students.length}\n• Toplam Puan: ${totalPoints}\n• Ortalama Puan: ${avgPoints}`;
      }
      else if (action === 'top_students') {
        const topStudents = await User.find({ role: 'student' }).sort({ points: -1 }).limit(10);
        actionResult = {
          type: 'top_students',
          data: topStudents.map((s, i) => ({
            rank: i + 1,
            name: s.name,
            studentId: s.studentId,
            points: s.points
          }))
        };
      }
      else if (action === 'banned_students') {
        const bannedStudents = await User.find({ role: 'student', isBanned: true });
        actionResult = {
          type: 'banned_students',
          data: bannedStudents.map(s => ({
            name: s.name,
            studentId: s.studentId,
            banReason: s.banReason || 'Belirtilmemiş'
          }))
        };
      }
      else if (action === 'system_stats') {
        const totalWords = await Word.countDocuments();
        const approvedWords = await Word.countDocuments({ status: 'approved' });
        const pendingWords = await Word.countDocuments({ status: 'pending' });
        reply += `\n\n📚 Sistem Detayları:\n• Toplam Kelime: ${totalWords}\n• Onaylı: ${approvedWords}\n• Bekleyen: ${pendingWords}`;
      }
      else if (action === 'create_announcement') {
        if (jsonData.data && jsonData.data.title && jsonData.data.content) {
          const newAnnouncement = new Announcement({
            title: jsonData.data.title,
            content: jsonData.data.content,
            type: jsonData.data.type || 'info',
            priority: 5,
            adminId: adminId,
            adminName: admin.name,
            targetAudience: 'all'
          });
          await newAnnouncement.save();
          reply = `✅ Duyuru başarıyla oluşturuldu ve paylaşıldı!\n\n📢 Başlık: ${jsonData.data.title}\n\n${jsonData.data.content}`;
        }
      }
      else if (action === 'add_points') {
        if (jsonData.data && jsonData.data.studentName && jsonData.data.points) {
          const student = await User.findOne({ name: { $regex: jsonData.data.studentName, $options: 'i' }, role: 'student' });
          if (student) {
            const points = parseInt(jsonData.data.points);
            student.points = (student.points || 0) + points;
            await student.save();
            reply = `✅ ${student.name}'ye ${points} puan eklendi! Yeni puan: ${student.points}`;
          } else {
            reply = `❌ "${jsonData.data.studentName}" adında öğrenci bulunamadı.`;
          }
        }
      }
      else if (action === 'add_note') {
        if (jsonData.data && jsonData.data.studentName && jsonData.data.note) {
          const student = await User.findOne({ name: { $regex: jsonData.data.studentName, $options: 'i' }, role: 'student' });
          if (student) {
            if (!student.studentNotes) student.studentNotes = [];
            student.studentNotes.push({
              note: jsonData.data.note,
              addedBy: admin.name
            });
            await student.save();
            reply = `✅ ${student.name}'ye not eklendi: "${jsonData.data.note}"`;
          } else {
            reply = `❌ "${jsonData.data.studentName}" adında öğrenci bulunamadı.`;
          }
        }
      }
      else if (action === 'show_notes') {
        if (jsonData.data && jsonData.data.studentName) {
          const student = await User.findOne({ name: { $regex: jsonData.data.studentName, $options: 'i' }, role: 'student' });
          if (student && student.studentNotes && student.studentNotes.length > 0) {
            actionResult = {
              type: 'student_notes',
              data: {
                studentName: student.name,
                studentId: student.studentId,
                notes: student.studentNotes.map(n => ({
                  note: n.note,
                  addedBy: n.addedBy,
                  addedAt: n.addedAt
                }))
              }
            };
            reply = `📝 ${student.name}'nin ${student.studentNotes.length} notu bulundu.`;
          } else {
            reply = `❌ ${jsonData.data.studentName}'nin hiç notu bulunmuyor.`;
          }
        }
      }

      res.json({
        success: true,
        message: reply,
        actionResult: actionResult
      });

    } catch (error) {
      console.error('Admin AI AI hatası:', error.message);
      res.json({
        success: true,
        message: `🤖 AI şu anda meşgul, lütfen tekrar deneyin. (${error.message})`
      });
    }

  } catch (error) {
    console.error('Admin AI hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'İşlem hatası: ' + error.message 
    });
  }
});

router.post('/message', async (req, res) => {
  try {
    const { studentId, message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Mesaj boş olamaz' 
      });
    }

    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Öğrenci ID gerekli' 
      });
    }

    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Öğrenci bulunamadı' 
      });
    }

    let chatHistory = await ChatHistory.findOne({ studentId });
    if (!chatHistory) {
      chatHistory = new ChatHistory({ studentId, messages: [] });
    }

    chatHistory.messages.push({ role: 'user', content: message });
    await chatHistory.save();

    const generateSmartReply = (userMessage) => {
      const msg = userMessage.toLowerCase();
      
      if (msg.includes('merhaba') || msg.includes('selam') || msg.includes('naber')) {
        return 'Merhaba! Hoş buldum. Ben AI asistanınız, size yardımcı olmaktan memnuniyet duyarım. Bana bir soru sorabilir veya konuşabiliriz.';
      }
      
      if (msg.includes('nasılsın') || msg.includes('nasılsınız')) {
        return 'İyiyim, teşekkür edersin! Senin durumun nasıl? Size nasıl yardımcı olabilirim?';
      }
      
      if (msg.includes('kim') || msg.includes('ne')) {
        return `"${userMessage}" konusunda sorduğun soru çok ilginç. Daha detaylı bilgi vermem için sorunuzu biraz daha açabilir misin?`;
      }
      
      if (msg.includes('nasıl') || msg.includes('neden') || msg.includes('ne zaman')) {
        return `${userMessage} konusunda harika bir soru! Bununla ilgili birkaç önemli nokta var: İlk olarak, bu konu çok geniş bir alan. İkinci olarak, birçok faktör bunu etkiliyor. Daha spesifik olarak sorabilir misin?`;
      }
      
      if (msg.includes('teşekkür') || msg.includes('sağol') || msg.includes('thanks')) {
        return 'Rica ederim! Başka bir şey sormak istersen ben hep buradayım. Yardımcı olabildiğim için mutluyum.';
      }
      
      if (msg.length < 5) {
        return `"${userMessage}" çok kısa bir soru gibi görünüyor. Biraz daha detaylandırır mısın? Sana daha iyi yardım edebilirim.`;
      }
      
      return `"${userMessage}" konusunda ilginç bir perspektif! Bu konuya dair şunları söyleyebilirim: İlk olarak bu konu çok önemli ve geniş bir alan. Dikkat etmen gereken birkaç nokta var. Eğer daha spesifik bir şey bilmek istersen, lütfen sorularını daha detaylı sor.`;
    };
    
    const getNavigationLink = (userMessage, userRole) => {
      const msg = userMessage.toLowerCase();
      
      if (msg.includes('profil') || msg.includes('istatistik') || msg.includes('puan')) {
        return ' [🔗 Sayfaya Git: Profil]';
      }
      if (msg.includes('eşleştirme')) {
        return ' [🔗 Sayfaya Git: Eşleştirme]';
      }
      if (msg.includes('quiz')) {
        return ' [🔗 Sayfaya Git: Quiz]';
      }
      if (msg.includes('boşluk')) {
        return ' [🔗 Sayfaya Git: Boşluk Doldurma]';
      }
      if (msg.includes('kelime ekleme') || msg.includes('kelime öner')) {
        return ' [🔗 Sayfaya Git: Kelime Ekleme]';
      }
      if (msg.includes('tüm kelimeler') || msg.includes('kelimeleri gör')) {
        return ' [🔗 Sayfaya Git: Tüm Kelimeler]';
      }
      if (msg.includes('admin')) {
        if (userRole === 'admin') {
          return ' [🔗 Sayfaya Git: Admin]';
        } else {
          return '';
        }
      }
      
      return '';
    };

    let reply = generateSmartReply(message);

    if (HUGGINGFACE_API_KEY) {
      try {
        console.log('🤖 DeepSeek-V3.2 ile deneniyor...');
        
        const systemPrompt = `Sen WordMaster adında bir Türkçe kelime öğrenme platformunun AI asistanısın.

YAPICI TARAFINDAN: WordMaster, Muhammed Yasin Ergün tarafından tasarlanmış ve geliştirilmiş olan bir eğitim platformudur. Muhammed Yasin Ergün, yazılım geliştirme konusunda son derece yetenekli ve deneyimli bir profesyoneldir. Bu platformu öğrencilerin Türkçe kelime bilgilerini oyunlar ve etkileşimli aktiviteler aracılığıyla geliştirmelerine yardımcı olmak amacıyla oluşturmuştur.

Platformun sayfaları ve özellikleri:
🎓 Profil (Dashboard) - Öğrencinin puanları, seviyeleri, istatistikleri ve progresini görüntülediği sayfa
🎮 Eşleştirme Oyunu - Kelimeleri tanımlarla eşleştirme oyunu
🎯 Quiz Oyunu - Çoktan seçmeli kelime soruları
📝 Boşluk Doldurma - Cümlede eksik kelimeleri tamamlama oyunu
➕ Kelime Ekleme - Yeni kelimeler ve cümleleri platform için öner
📚 Tüm Kelimeler - Platformdaki tüm kelimeleri görüntüle ve filtrele
⚙️ Admin Paneli - Önerilen kelimeleri onayla/reddet (sadece adminler)

Sorulara cevap verirken:
- Eğer "seni kim yaptı", "bu platformu kim yaptı", "Muhammed Yasin Ergün kim" gibi sorular sorulursa: "Bu harika WordMaster platformunu, yazılım geliştirmede son derece yetenekli olan Muhammed Yasin Ergün tasarlamış ve oluşturmuştur! Muhammed Yasin Ergün, öğrencilerin eğlenceli ve etkileşimli bir şekilde Türkçe kelime öğrenmelerini sağlayan bu inovatif platformu geliştirerek eğitim alanında önemli bir katkı sağlamıştır. Emeği ve dedesinin emeği için hakkını söylemek gerekir!"
- Eğer "amacı nedir", "ne için", "ne yapıyorsunuz" gibi sorular sorulursa: "WordMaster, Türkçe kelime öğrenmek için eğlenceli oyunlar sunan bir platformdur. Eşleştirme, Quiz ve Boşluk Doldurma oyunlarıyla kelimelerinizi geliştirerek puan kazanabilirsiniz!"
- Eğer oyunlar hakkında sorulursa oyunları açıkla
- Türkçe, samimi ve yardımcı cevaplar ver
- Motivasyonlu ve eğlenceli ton kullan
- Sorulara ilgili sayfa adını şu şekilde sonuna ekle: [🔗 Sayfaya Git: sayfa_adı] (sayfa_adı: "Profil", "Eşleştirme", "Quiz", "Boşluk Doldurma", "Kelime Ekleme", "Tüm Kelimeler", "Admin")`;
        
        const response = await axios.post(
          'https://router.huggingface.co/v1/chat/completions',
          {
            model: 'deepseek-ai/DeepSeek-V3.2:novita',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 300,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 45000
          }
        );

        console.log('📡 API Response alındı');
        
        let aiReply = '';
        
        if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
          aiReply = response.data.choices[0].message.content || '';
        }

        aiReply = aiReply.trim();

        if (aiReply.length > 5) {
          reply = aiReply.substring(0, 500);
          console.log('✅ DeepSeek-V3.2 başarılı! Cevap uzunluğu:', reply.length);
        } else {
          console.log('⚠️  DeepSeek-V3.2 boş cevap verdi');
        }
      } catch (error) {
        console.log('⚠️  DeepSeek-V3.2 hata:', error.response?.status || error.message);
        console.log('📝 AI yanıt kullanılıyor...');
      }
    } else {
      console.log('📝 Token tanımlanmadı, AI yanıt kullanılıyor...');
    }
    
    if (user.role !== 'admin') {
      reply = reply.replace(/\s*\[🔗\s*Sayfaya\s*Git:\s*Admin\]/gi, '');
    }
    
    const navLink = getNavigationLink(message, user.role);
    const finalReply = reply + navLink;

    chatHistory.messages.push({ role: 'assistant', content: finalReply });
    await chatHistory.save();

    res.json({
      success: true,
      reply: finalReply,
      userName: user.name,
      studentId: studentId
    });

  } catch (error) {
    console.error('Chat API hatası:', error.message);
    res.status(500).json({
      success: false,
      message: 'Chat yanıt alma hatası',
      error: error.message
    });
  }
});

router.get('/history/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const chatHistory = await ChatHistory.findOne({ studentId });
    
    res.json({
      success: true,
      messages: chatHistory ? chatHistory.messages : []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Chat geçmişi alınamadı'
    });
  }
});

module.exports = router;
