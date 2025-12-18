require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ogrenci-sistemi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB bağlantısı başarılı\n');

    const admin = await User.findOne({ studentId: 'admin001' });
    
    if (admin) {
      console.log('📊 Admin Kullanıcı Bilgileri:');
      console.log('   - studentId:', admin.studentId);
      console.log('   - name:', admin.name);
      console.log('   - role:', admin.role);
      console.log('   - class:', admin.class);
      console.log('   - _id:', admin._id);
      
      if (admin.role !== 'admin') {
        console.log('\n❌ Role "admin" değil! Düzeltiliyor...');
        admin.role = 'admin';
        await admin.save();
        console.log('✅ Role "admin" olarak güncellendi!');
      } else {
        console.log('\n✅ Role zaten "admin" olarak set edilmiş');
      }
    } else {
      console.log('❌ Admin001 bulunamadı. Oluşturuluyor...');
      
      const newAdmin = new User({
        studentId: 'admin001',
        password: 'admin123456',
        name: 'Yönetici',
        class: 'Admin',
        role: 'admin',
        isFirstLogin: false
      });
      
      await newAdmin.save();
      console.log('✅ Admin kullanıcısı oluşturuldu:');
      console.log('   - studentId: admin001');
      console.log('   - password: admin123456');
      console.log('   - role: admin');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

checkAdmin();
