
const mongoose = require('mongoose');
const Word = require('./models/Word');

mongoose.connect('mongodb+srv://ahmet:Pass1881@cluster0.mongodb.net/okulproje23?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected'))
.then(async () => {
  const count = await Word.countDocuments({status: 'approved'});
  console.log('Approved words count:', count);
  
  if (count === 0) {
    console.log('Creating sample approved words...');
    
    const sampleWords = [
      { word: 'Test', meaning: 'Test etme, inceleme', example: 'Bu bir test cümlesidir.', language: 'turkish', studentId: 'sample', studentName: 'System', studentClass: 'Admin', status: 'approved' },
      { word: 'Example', meaning: 'Örnek, numune', example: 'Bu bir örnek cümlesidir.', language: 'english', studentId: 'sample', studentName: 'System', studentClass: 'Admin', status: 'approved' },
      { word: 'Word', meaning: 'Kelime, söz', example: 'Bu bir kelime örneğidir.', language: 'turkish', studentId: 'sample', studentName: 'System', studentClass: 'Admin', status: 'approved' }
    ];
    
    for (let i = 0; i < 7; i++) {
      sampleWords.push({
        word: 'Sample' + i,
        meaning: 'Örnek sözcük ' + i,
        example: 'Bu örnek cümle ' + i + ' dir.',
        language: 'turkish',
        studentId: 'sample',
        studentName: 'System',
        studentClass: 'Admin',
        status: 'approved'
      });
    }
    
    await Word.insertMany(sampleWords);
    console.log('Created 10 sample words');
  }
  
  const sample = await Word.findOne({status: 'approved'});
  console.log('Sample word:', sample);
})
.catch(e => console.error('Error:', e.message))
.finally(() => mongoose.connection.close());
