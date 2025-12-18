const axios = require('axios');
require('dotenv').config();

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

const PROFANITY_LIST = [
  'pç', 'piç', 'aq', 'bk', 'mk', 'bok', 'sik', 'amin', 'orospu', 'fahişe',
  'fuhuş', 'seks', 'porno', 'dildo', 'klitoris', 'tecavüz', 'aptal', 'malaka',
  'terbiyesiz', 'edepsiz', 'ahlaksız', 'şerefsiz', 'alçak', 'kaltak', 'kancık',
  'utanmaz', 'vahşi', 'lanet', 'leş', 'homoseksüel', 'jigolo', 'leymun', 'melun',
  'kahpe', 'ifsaçı', 'kokoş', 'dandik', 'cunta', 'cımbız', 'cılız', 'çörlek',
  'çömlek', 'çöfti', 'berkent', 'berkentleme', 'berkentci', 'dalk', 'dalak',
  'demirci', 'deresi', 'derisini', 'devişirmeci', 'dilencilik', 'diş', 'dişsiz',
  'doğru', 'doğru', 'dolu', 'domuz', 'donla', 'donuk', 'dore', 'döl', 'döllemeci',
  'dönerci', 'dörtnal', 'dönen', 'döneraltı', 'döşek', 'dudu', 'duduk', 'duraç',
  'durakçı', 'durakçılık', 'durakçı', 'duran', 'durek', 'durgün', 'durlu', 'durmaz',
  'durmayan', 'durmuş', 'durmuşluk', 'durna', 'dursakçı', 'dursak', 'duru', 'duruduk',
  'durulanmak', 'durulanmış', 'duruldu', 'duruluş', 'duruluşta', 'duruluştaki', 'duruluşu',
  'duruluşum', 'duruluşumuz', 'duruluşu', 'duruluşunun', 'duruluşunuza', 'duruluşunda',
  'duruluşundan', 'duruluşunda', 'duruluşundan', 'duruluşunda', 'duruluşundan',
  'çürük', 'çürümlü', 'çürümez', 'çürümüş', 'çürümüşlük', 'çürümüşler', 'çüf', 'çüfür',
  'çüfürlük', 'çüfcü', 'çüfcülük', 'çüfcüler', 'çümle', 'çümlelemek', 'çümleleme',
  'uyuşturucu', 'uydurma', 'uydurmacı', 'uydurmacılık', 'uydurmalar', 'uydurmak',
  'uydurtu', 'uydurtmak', 'uygun', 'uygunluk', 'uygunsuz', 'uygunsuzluk', 'uygur',
  'uygurca', 'uyguristan', 'uyku', 'uykucu', 'uykucusu', 'uykuculuk', 'uykudaki',
  'uykudan', 'uykuhalı', 'uykuhalık', 'uykuhayal', 'uykuhayalı', 'uykuhalı', 'uykuhalı',
  'uykuhavai', 'uykujigolo', 'uykujigololuk', 'uykujigololara', 'uykuluk', 'uykulu',
  'uykululuk', 'uykuması', 'uykumaşı', 'uykumla', 'uykumun', 'uykumuz', 'uykumuzda',
  'uykumuzdan', 'uykusallık', 'uykusal', 'uykusallığı', 'uykusallığını', 'uykusu',
  'uykusu', 'uykusuz', 'uykusuzluk', 'uykuşu', 'uykuşuluk', 'uykutat', 'uykutatı',
  'uykutatlı', 'uykutatlılık', 'uykututu', 'uykututucu', 'uykututuluk', 'uykututucu',
  'uykutturmak', 'uykuttu', 'uykuttular', 'uykuyla', 'uykuyle', 'uykuymuş', 'uykuz',
  'uykuzluk', 'uykuzlukla', 'uykuzluğu'
];

const SLANG_CENSORING = {
  'p[çc]': '***',
  'aq': '**',
  'bk': '**',
  'mk': '**',
  'bok': '***',
  'sik': '***',
  'amin': '****',
  'orosp': '****',
  '[aş]?ker?ekler': '****',
  'seks': '***',
  'porn': '****',
  'meme': '****',
  'yapma': '****',
  'yapma': '****',
  'yapman': '****',
  'yapmak': '****'
};

const censorContent = (text) => {
  if (!text) return text;
  
  let censored = text.toLowerCase();
  
  for (const [pattern, replacement] of Object.entries(SLANG_CENSORING)) {
    const regex = new RegExp(pattern, 'gi');
    censored = censored.replace(regex, replacement);
  }
  
  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    censored = censored.replace(regex, '*'.repeat(word.length));
  });
  
  return censored;
};

const hasProfanity = (text) => {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  const cleanText = lowerText.replace(/[^a-zçğıöşü\s]/g, '');
  const words = cleanText.split(/\s+/);
  
  for (const profanityWord of PROFANITY_LIST) {
    for (const word of words) {
      if (word === profanityWord || word.includes(profanityWord)) {
        return true;
      }
    }
    
    if (cleanText.includes(profanityWord)) {
      return true;
    }
  }
  
  for (const pattern of Object.keys(SLANG_CENSORING)) {
    const regex = new RegExp(pattern, 'gi');
    if (regex.test(lowerText) || regex.test(cleanText)) {
      return true;
    }
  }
  
  const commonSlang = [
    /p+[çc]+/gi, /a+q+/gi, /b+k+/gi, /m+k+/gi, /s+[i1]+k+/gi, /am+[i1]+n+a*/gi,
    /or+o+s+p+/gi, /bok+/gi, /[aş]+k+a+/gi, /b+[o0]+k+/gi, /sik+i+k+/gi,
    /sek+s+/gi, /p+or+n+o+/gi, /osx?p+u+/gi, /kuf+ur+/gi, /[sş]+ene+/gi,
    /[aıeöüç]+lç+[aıeöüç]+k+/gi, /aptal+/gi, /mal+ak+a*/gi, /haram+/gi
  ];
  
  for (const pattern of commonSlang) {
    if (pattern.test(lowerText)) {
      return true;
    }
  }
  
  return false;
};

const validateWord = async (word, meaning, language) => {
  try {
    if (hasProfanity(word) || hasProfanity(meaning)) {
      return {
        success: true,
        isValid: false,
        score: 0,
        decision: 'REJECT',
        reason: 'Uygunsuz içerik tespit edildi',
        aiValidated: false
      };
    }

    if (!HUGGINGFACE_API_KEY) {
      return getBasicWordValidation(word, meaning, language);
    }

    const systemPrompt = `Sen bir dil uzmanı ve kelime validatörüsün.
Verilen kelimeyi ve tanımını analiz ederek şu kriterleri kontrol etmelisin:
1. İçerik Kalitesi: minimum 2 karakter kelime, 10 karakter tanım
2. Dil Doğruluğu: Yazım hataları olmamalı
3. Uygunsuz İçerik: Müstehcen veya tehditkar olmamalı

JSON formatında cevap ver:
{"isValid":true/false,"score":0-100,"decision":"APPROVE"/"REJECT","reason":"açıklama"}`;

    const response = await axios.post(
      'https://router.huggingface.co/v1/chat/completions',
      {
        model: 'deepseek-ai/DeepSeek-V3.2:novita',
        messages: [
          {role:'system',content:systemPrompt},
          {role:'user',content:`Dil: ${language}\nKelime: "${word}"\nAnlamı: "${meaning}"`}
        ],
        max_tokens: 150,
        temperature: 0.5
      },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      }
    );

    let aiReply = '';
    if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      aiReply = response.data.choices[0].message.content || '';
    }

    try {
      const jsonStart = aiReply.indexOf('{');
      const jsonEnd = aiReply.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = aiReply.substring(jsonStart, jsonEnd + 1);
        const result = JSON.parse(jsonStr);
        return {success:true,...result,aiValidated:true};
      }
    } catch (e) {}

    return getBasicWordValidation(word, meaning, language);

  } catch (error) {
    console.log('⚠️ AI kelime validasyon hatası:', error.message);
    return getBasicWordValidation(word, meaning, language);
  }
};

const validateSentence = async (sentence, language) => {
  try {
    if (hasProfanity(sentence)) {
      return {
        success: true,
        isValid: false,
        score: 0,
        decision: 'REJECT',
        reason: 'Uygunsuz içerik tespit edildi',
        aiValidated: false
      };
    }

    if (!HUGGINGFACE_API_KEY) {
      return getBasicSentenceValidation(sentence, language);
    }

    const systemPrompt = `Sen bir dil uzmanı ve cümle validatörüsün.
Cümleyi analiz ederek kontrol etmelisin:
1. Uzunluk: minimum 8 kelime
2. Gramer ve yazım: hatasız olmalı
3. Noktalama: cümle başında büyük, sonunda nokta olmalı
4. Uygunsuz İçerik: olmamalı

JSON formatında cevap ver:
{"isValid":true/false,"score":0-100,"decision":"APPROVE"/"REJECT","reason":"açıklama"}`;

    const response = await axios.post(
      'https://router.huggingface.co/v1/chat/completions',
      {
        model: 'deepseek-ai/DeepSeek-V3.2:novita',
        messages: [
          {role:'system',content:systemPrompt},
          {role:'user',content:`Dil: ${language}\nCümle: "${sentence}"`}
        ],
        max_tokens: 120,
        temperature: 0.5
      },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      }
    );

    let aiReply = '';
    if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      aiReply = response.data.choices[0].message.content || '';
    }

    try {
      const jsonStart = aiReply.indexOf('{');
      const jsonEnd = aiReply.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = aiReply.substring(jsonStart, jsonEnd + 1);
        const result = JSON.parse(jsonStr);
        return {success:true,...result,aiValidated:true};
      }
    } catch (e) {}

    return getBasicSentenceValidation(sentence, language);

  } catch (error) {
    console.log('⚠️ AI cümle validasyon hatası:', error.message);
    return getBasicSentenceValidation(sentence, language);
  }
};

const getBasicWordValidation = (word, meaning, language) => {
  const issues = [];
  let score = 100;

  if (word.length < 2) {
    issues.push('Kelime çok kısa');
    score -= 40;
  }

  if (meaning.length < 10) {
    issues.push('Tanım çok kısa');
    score -= 30;
  }

  if (/[0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>?\/]/.test(word)) {
    issues.push('Uygunsuz karakterler');
    score -= 40;
  }

  return {
    success: true,
    isValid: score >= 70,
    score: Math.max(0, score),
    decision: score >= 70 ? 'APPROVE' : 'REJECT',
    reason: issues.length > 0 ? issues.join(', ') : 'Geçerli',
    aiValidated: false
  };
};

const getBasicSentenceValidation = (sentence, language) => {
  const issues = [];
  let score = 100;

  const words = sentence.trim().split(/\s+/);

  if (words.length < 8) {
    issues.push('Cümle çok kısa');
    score -= 40;
  }

  if (!sentence.endsWith('.') && !sentence.endsWith('!') && !sentence.endsWith('?')) {
    issues.push('Nokta eksik');
    score -= 20;
  }

  return {
    success: true,
    isValid: score >= 70,
    score: Math.max(0, score),
    decision: score >= 70 ? 'APPROVE' : 'REJECT',
    reason: issues.length > 0 ? issues.join(', ') : 'Geçerli',
    aiValidated: false
  };
};

module.exports = {validateWord, validateSentence};
