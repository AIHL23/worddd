const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ogrenci-sistemi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB bağlantısı başarılı\n');

    const adminData = {
      studentId: "admin001",
      password: "admin123456",
      name: "Yönetici",
      class: "Admin",
      role: "admin",
      isFirstLogin: false,
      isBanned: false,
      profilePhoto: ""
    };

    // Önceden admin var mı kontrol et
    const existingAdmin = await User.findOne({ studentId: adminData.studentId });
    if (existingAdmin) {
      console.log('⚠️  Admin hesabı zaten mevcut!\n');
      console.log('🔐 Mevcut Admin Bilgileri:');
      console.log(`   Öğrenci Numarası: ${existingAdmin.studentId}`);
      console.log(`   Adı: ${existingAdmin.name}`);
      console.log(`   Rol: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Yeni admin oluştur (pre-save hook otomatik olarak hash'ler)
    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin hesabı başarıyla oluşturuldu!\n');
    console.log('📝 Admin Bilgileri:');
    console.log(`   _id: ${admin._id}`);
    console.log(`   Öğrenci Numarası: ${admin.studentId}`);
    console.log(`   Adı: ${admin.name}`);
    console.log(`   Rol: ${admin.role}`);
    console.log(`   Sınıfı: ${admin.class}`);
    console.log(`   Database'deki Şifre: ${admin.password}`);
    console.log(`   Şifre Hash'li: ${admin.password.startsWith('$2')}\n`);

    console.log('🔑 Giriş Bilgileri:');
    console.log(`   Öğrenci Numarası: ${adminData.studentId}`);
    console.log(`   Şifre: ${adminData.password}`);
    console.log(`\n💡 Admin paneline erişmek için bu bilgilerle giriş yapın.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

createAdmin();
