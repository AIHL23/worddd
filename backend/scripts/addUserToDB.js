const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function addUserToDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ogrenci-sistemi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB bağlantısı başarılı\n');

    const userData = {
      studentId: "812",
      plainPassword: "yasi2000",
      name: "Muhammed Yasin ERGÜN",
      class: "11/B",
      points: 431,
      isFirstLogin: false,
      role: "student",
      isBanned: false,
      profilePhoto: ""
    };

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(userData.plainPassword, 12);

    const user = new User({
      studentId: userData.studentId,
      password: hashedPassword,
      name: userData.name,
      class: userData.class,
      points: userData.points,
      isFirstLogin: userData.isFirstLogin,
      role: userData.role,
      isBanned: userData.isBanned,
      profilePhoto: userData.profilePhoto,
      lastLogin: new Date()
    });

    await user.save();

    console.log('✅ Öğrenci başarıyla eklendi!\n');
    console.log('📝 Öğrenci Bilgileri:');
    console.log(`   _id: ${user._id}`);
    console.log(`   Öğrenci Numarası: ${user.studentId}`);
    console.log(`   Adı: ${user.name}`);
    console.log(`   Sınıfı: ${user.class}`);
    console.log(`   Puanı: ${user.points}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Yasaklı: ${user.isBanned}`);
    console.log('\n🔐 Giriş Bilgileri:');
    console.log(`   Öğrenci Numarası: ${userData.studentId}`);
    console.log(`   Şifre: ${userData.plainPassword}`);

    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
      console.error(`❌ Hata: Bu öğrenci numarası (${userData.studentId}) zaten kayıtlı!`);
    } else {
      console.error('❌ Hata:', error.message);
    }
    process.exit(1);
  }
}

addUserToDatabase();
