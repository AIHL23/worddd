const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ogrenci-sistemi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB bağlantısı başarılı\n');

    const users = await User.find({});
    
    console.log(`📊 Toplam ${users.length} kullanıcı:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.studentId} - ${user.name} (${user.class})`);
    });

    console.log('\n\n🔍 "812" ile arama yapılıyor...');
    const user = await User.findOne({ studentId: '812' });
    
    if (user) {
      console.log('✅ BULUNDU!');
      console.log(`   _id: ${user._id}`);
      console.log(`   studentId: ${user.studentId}`);
      console.log(`   name: ${user.name}`);
    } else {
      console.log('❌ Bulunamadı');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

checkDatabase();
