const express = require('express');
const User = require('../models/User');
const GameInvitation = require('../models/GameInvitation');
const GameSession = require('../models/GameSession');
const Word = require('../models/Word');
const Notification = require('../models/Notification');
const router = express.Router();

router.post('/invite', async (req, res) => {
  try {
    const { fromStudentId, toStudentId } = req.body;

    if (!fromStudentId || !toStudentId) {
      return res.status(400).json({ message: 'Eksik bilgi' });
    }

    if (fromStudentId === toStudentId) {
      return res.status(400).json({ message: 'Kendinize daveti göndereemezsiniz' });
    }

    const fromUser = await User.findOne({ studentId: fromStudentId });
    const toUser = await User.findOne({ studentId: toStudentId });

    if (!fromUser) {
      return res.status(404).json({ message: 'Gönderici bulunamadı' });
    }

    if (!toUser) {
      return res.status(404).json({ message: 'Alıcı öğrenci bulunamadı' });
    }

    const existingInvitation = await GameInvitation.findOne({
      fromUser: fromUser._id,
      toUser: toUser._id,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvitation) {
      return res.status(400).json({ message: 'Zaten beklemede bir davet var' });
    }

    const invitation = new GameInvitation({
      fromUser: fromUser._id,
      fromStudentId,
      toUser: toUser._id,
      toStudentId,
      gameType: 'collaboration'
    });

    await invitation.save();

    const gameSession = new GameSession({
      players: [fromUser._id, toUser._id],
      playerStudentIds: [fromStudentId, toStudentId],
      mode: 'multiplayer',
      status: 'waiting'
    });

    gameSession.playerScores = [
      { playerId: fromUser._id, studentId: fromStudentId, playerName: fromUser.name, score: 0, correctAnswers: 0, totalAnswered: 0 },
      { playerId: toUser._id, studentId: toStudentId, playerName: toUser.name, score: 0, correctAnswers: 0, totalAnswered: 0 }
    ];

    await gameSession.save();

    invitation.gameSessionId = gameSession._id;
    await invitation.save();

    console.log('📬 Notification oluşturuluyor:', {
      invitationId: invitation._id,
      gameSessionId: gameSession._id,
      toUser: toUser._id
    });

    const notification = new Notification({
      userId: toUser._id,
      type: 'game_invite',
      title: '🎮 Oyun Daveti',
      message: `${fromUser.name} sizi oyuna davet etti`,
      relatedUserId: fromUser._id,
      relatedGameInvitationId: invitation._id,
      relatedGameSessionId: gameSession._id,
      isRead: false
    });

    await notification.save();
    console.log('✅ Notification kaydedildi:', notification._id);

    res.status(201).json({
      success: true,
      message: 'Davet gönderildi',
      invitation,
      gameSessionId: gameSession._id,
      gameSession
    });
  } catch (error) {
    console.error('Davet gönderme hatası:', error);
    res.status(500).json({ message: 'Davet gönderilemedi', error: error.message });
  }
});

router.post('/invitation/:invitationId/accept', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { acceptedByStudentId } = req.body;

    const invitation = await GameInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Davet bulunamadı' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Bu davet artık geçerli değil' });
    }

    if (invitation.toStudentId !== acceptedByStudentId) {
      return res.status(403).json({ message: 'Yetkilendirme hatası' });
    }

    const fromUser = await User.findOne({ studentId: invitation.fromStudentId });
    const toUser = await User.findOne({ studentId: invitation.toStudentId });

    console.log('📝 Invitation gameSessionId:', invitation.gameSessionId);

    let gameSession = await GameSession.findById(invitation.gameSessionId);
    
    if (!gameSession) {
      console.log('⚠️ GameSession bulunamadı, yeni oluşturuluyor...');
      if (!invitation.gameSessionId) {
        gameSession = new GameSession({
          players: [fromUser._id, toUser._id],
          playerStudentIds: [invitation.fromStudentId, invitation.toStudentId],
          mode: 'multiplayer',
          status: 'waiting'
        });

        gameSession.playerScores = [
          { playerId: fromUser._id, studentId: invitation.fromStudentId, playerName: fromUser.name, score: 0, correctAnswers: 0, totalAnswered: 0 },
          { playerId: toUser._id, studentId: invitation.toStudentId, playerName: toUser.name, score: 0, correctAnswers: 0, totalAnswered: 0 }
        ];

        await gameSession.save();
        invitation.gameSessionId = gameSession._id;
        console.log('✅ Yeni GameSession oluşturuldu:', gameSession._id);
      } else {
        console.error('❌ GameSession ID var ama bulunamadı:', invitation.gameSessionId);
        return res.status(404).json({ message: 'Oyun oturumu bulunamadı' });
      }
    } else {
      console.log('✅ Mevcut GameSession bulundu:', gameSession._id);
    }

    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    await invitation.save();
    console.log('✅ Invitation kaydedildi, final gameSessionId:', gameSession._id);

    const acceptedNotification = new Notification({
      userId: fromUser._id,
      type: 'game_accepted',
      title: '✅ Oyun Daveti Kabul Edildi',
      message: `${toUser.name} oyun davetinizi kabul etti`,
      relatedUserId: toUser._id,
      relatedGameSessionId: gameSession._id,
      isRead: false
    });

    await acceptedNotification.save();

    res.json({
      success: true,
      message: 'Davet kabul edildi',
      gameSessionId: gameSession._id,
      gameSession
    });
  } catch (error) {
    console.error('Davet kabul hatası:', error);
    res.status(500).json({ message: 'Davet kabul edilemedi', error: error.message });
  }
});

router.post('/invitation/:invitationId/reject', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { rejectedByStudentId } = req.body;

    const invitation = await GameInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Davet bulunamadı' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Bu davet artık geçerli değil' });
    }

    if (invitation.toStudentId !== rejectedByStudentId) {
      return res.status(403).json({ message: 'Yetkilendirme hatası' });
    }

    invitation.status = 'rejected';
    invitation.respondedAt = new Date();
    await invitation.save();

    const rejectedNotification = new Notification({
      userId: invitation.fromUser,
      type: 'game_rejected',
      title: '❌ Oyun Daveti Reddedildi',
      message: 'Oyun davetiniz reddedildi',
      isRead: false
    });

    await rejectedNotification.save();

    res.json({
      success: true,
      message: 'Davet reddedildi'
    });
  } catch (error) {
    console.error('Davet reddetme hatası:', error);
    res.status(500).json({ message: 'Davet reddedilemedi', error: error.message });
  }
});

router.get('/invitation/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await GameInvitation.findById(invitationId)
      .populate('fromUser', 'name studentId')
      .populate('toUser', 'name studentId');

    if (!invitation) {
      return res.status(404).json({ message: 'Davet bulunamadı' });
    }

    res.json({
      status: invitation.status,
      gameSessionId: invitation.gameSessionId,
      fromUser: invitation.fromUser,
      toUser: invitation.toUser,
      createdAt: invitation.createdAt
    });
  } catch (error) {
    console.error('Davet alma hatası:', error);
    res.status(500).json({ message: 'Davet alınamadı', error: error.message });
  }
});

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await GameSession.findById(sessionId)
      .populate('players', 'studentId name')
      .populate('playerScores.playerId', 'studentId name');

    if (!session) {
      return res.status(404).json({ message: 'Oyun oturumu bulunamadı' });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Oyun oturumu alma hatası:', error);
    res.status(500).json({ message: 'Oturum alınamadı', error: error.message });
  }
});

router.post('/session/:sessionId/start', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { language = 'all' } = req.body;

    if (!sessionId || sessionId === 'undefined') {
      return res.status(400).json({ message: 'Geçersiz session ID' });
    }

    const session = await GameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Oyun oturumu bulunamadı' });
    }

    if (session.status === 'completed' || session.status === 'abandoned') {
      return res.status(400).json({ message: 'Oyun zaten tamamlanmış veya iptal edilmiş' });
    }

    if (!session.words || session.words.length === 0) {
      const isMultiplayer = session.players && session.players.length === 2;
      const wordsPerPlayer = 10;
      const totalWordsNeeded = isMultiplayer ? wordsPerPlayer * 2 : wordsPerPlayer;
      
      let query = { status: 'approved' };
      if (language !== 'all') {
        query.language = language;
      }

      const allWords = await Word.find(query).select('_id word meaning language').exec();

      if (allWords.length === 0) {
        return res.status(400).json({ message: 'Yeterli kelime bulunamadı' });
      }

      const selectedWords = [];
      for (let i = 0; i < totalWordsNeeded; i++) {
        selectedWords.push(allWords[Math.floor(Math.random() * allWords.length)]);
      }
      
      const formatWord = (w) => {
        let meaningToShow = w.meaning;
        if (Math.random() < 0.5 && allWords.length > 1) {
          const wrongWord = allWords[Math.floor(Math.random() * allWords.length)];
          if (wrongWord._id.toString() !== w._id.toString()) {
            meaningToShow = wrongWord.meaning;
          }
        }
        
        return {
          wordId: w._id,
          word: w.word,
          meaning: meaningToShow,
          answered: false,
          correctAnswer: null
        };
      };
      
      session.words = selectedWords.map(formatWord);
      session.markModified('words');
    }

    if (session.status === 'waiting') {
      session.status = 'active';
      session.startedAt = new Date();
    }

    session.language = language;
    await session.save();

    const freshSession = await GameSession.findById(sessionId);
    
    res.json({
      success: true,
      message: 'Oyun başlatıldı',
      session: freshSession,
      words: freshSession.words || []
    });
  } catch (error) {
    console.error('❌ Oyun başlatma hatası:', error);
    res.status(500).json({ message: 'Oyun başlatılamadı: ' + error.message });
  }
});

router.post('/session/:sessionId/answer', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { studentId, wordIndex, answer, isTimeout } = req.body;

    const session = await GameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Oyun oturumu bulunamadı' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ message: 'Oyun aktif değil' });
    }

    const currentPlayerStudentId = session.playerStudentIds[session.currentPlayerIndex];
    if (studentId !== currentPlayerStudentId) {
      return res.status(403).json({ message: 'Sıra sizde değil!' });
    }

    const playerScore = session.playerScores.find(ps => ps.studentId === studentId);
    if (!playerScore) {
      return res.status(404).json({ message: 'Oyuncu bulunamadı' });
    }

    const isMultiplayer = session.players && session.players.length === 2;
    let words = session.words || [];
    let isAnswerCorrect = false;
    
    if (wordIndex < words.length) {
      const currentWord = words[wordIndex];
      
      words[wordIndex].answered = true;
      words[wordIndex].correctAnswer = answer;

      const wordFromDB = await Word.findById(currentWord.wordId);
      if (isTimeout) {
        isAnswerCorrect = false;
        console.log(`⏰ Timeout - cevap otomatik yanlış sayıldı: ${studentId}, wordIndex: ${wordIndex}`);
      } else if (wordFromDB) {
        const meaningMatches = wordFromDB.meaning === currentWord.meaning;
        isAnswerCorrect = (answer === true && meaningMatches) || (answer === false && !meaningMatches);
        console.log(`✅ Answer validation - studentId: ${studentId}, wordIndex: ${wordIndex}, answer: ${answer}, meaningMatches: ${meaningMatches}, isCorrect: ${isAnswerCorrect}`);
      } else {
        console.warn(`⚠️ Word not found in DB: ${currentWord.wordId}`);
        isAnswerCorrect = false;
      }

      if (isAnswerCorrect) {
        playerScore.correctAnswers = (playerScore.correctAnswers || 0) + 1;
        playerScore.score = (playerScore.score || 0) + 20;
      }

      playerScore.totalAnswered = (playerScore.totalAnswered || 0) + 1;
      session.words = words;
      session.markModified('words');
    }

    const wasPlayer2 = session.currentPlayerIndex === 1;
    session.currentPlayerIndex = 1 - session.currentPlayerIndex;
    
    if (wasPlayer2) {
      session.currentWordIndex++;
    }

    if (session.currentWordIndex >= session.words.length) {
        session.status = 'completed';
        session.completedAt = new Date();
        session.duration = Math.floor((session.completedAt - session.startedAt) / 1000);

        const maxScore = Math.max(...session.playerScores.map(ps => ps.score));
        session.winnerIds = session.playerScores
          .filter(ps => ps.score === maxScore)
          .map(ps => ps.playerId);

        session.totalPoints = session.playerScores.reduce((sum, ps) => sum + ps.score, 0);
        
        for (let playerScore of session.playerScores) {
          const user = await User.findById(playerScore.playerId);
          if (user) {
            user.gamesPlayed = (user.gamesPlayed || 0) + 1;
            user.totalGameTime = (user.totalGameTime || 0) + (session.duration || 0);
            
            let bonusPoints = 0;
            if (session.winnerIds.some(winnerId => winnerId.toString() === user._id.toString())) {
              bonusPoints = 100;
            } else if (maxScore === 0 || session.playerScores.every(ps => ps.score === 0)) {
              bonusPoints = 0;
            } else if (maxScore === playerScore.score && session.playerScores.filter(ps => ps.score === maxScore).length > 1) {
              bonusPoints = 50;
            }
            
            user.points = (user.points || 0) + playerScore.score + bonusPoints;
            await user.save();
          }
        }
    }

    await session.save();

    const playerScores = session.playerScores.map(ps => ({
      name: ps.playerName || ps.studentId,
      score: ps.score || 0,
      correct: ps.correctAnswers || 0,
      total: ps.totalAnswered || 0
    }));

    res.json({
      success: true,
      isCorrect: isAnswerCorrect,
      playerScore,
      playerScores,
      currentPlayerIndex: session.currentPlayerIndex,
      currentWordIndex: session.currentWordIndex,
      isGameFinished: session.status === 'completed'
    });
  } catch (error) {
    console.error('Cevap kaydı hatası:', error);
    res.status(500).json({ message: 'Cevap kaydedilemedi', error: error.message });
  }
});

router.post('/session/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await GameSession.findById(sessionId)
      .populate('players', 'studentId name points')
      .populate('playerScores.playerId', 'studentId name');

    if (!session) {
      return res.status(404).json({ message: 'Oyun oturumu bulunamadı' });
    }

    session.status = 'completed';
    session.completedAt = new Date();
    session.duration = Math.floor((session.completedAt - session.startedAt) / 1000);

    const maxScore = Math.max(...session.playerScores.map(ps => ps.score));
    session.winnerIds = session.playerScores
      .filter(ps => ps.score === maxScore)
      .map(ps => ps.playerId);

    session.totalPoints = session.playerScores.reduce((sum, ps) => sum + ps.score, 0);

    await session.save();

    const isMultiplayer = session.mode === 'multiplayer';

    for (let playerScore of session.playerScores) {
      const user = await User.findById(playerScore.playerId);
      if (user) {
        user.gamesPlayed = (user.gamesPlayed || 0) + 1;
        user.totalGameTime = (user.totalGameTime || 0) + (session.duration || 0);
        
        if (isMultiplayer) {
          let bonusPoints = 0;
          if (session.winnerIds.some(winnerId => winnerId.toString() === user._id.toString())) {
            bonusPoints = 100;
          } else if (maxScore === 0 || session.playerScores.every(ps => ps.score === 0)) {
            bonusPoints = 0;
          } else if (maxScore === playerScore.score && session.playerScores.filter(ps => ps.score === maxScore).length > 1) {
            bonusPoints = 50;
          }
          
          user.points = (user.points || 0) + playerScore.score + bonusPoints;
        }
        
        await user.save();
      }
    }

    res.json({
      success: true,
      message: 'Oyun tamamlandı',
      session
    });
  } catch (error) {
    console.error('Oyun tamamlama hatası:', error);
    res.status(500).json({ message: 'Oyun tamamlanamadı', error: error.message });
  }
});

router.post('/session/:sessionId/abandon', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await GameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Oyun oturumu bulunamadı' });
    }

    session.status = 'abandoned';
    session.completedAt = new Date();
    await session.save();

    const players = await User.find({ _id: { $in: session.players } });
    
    players.forEach(player => {
      if (player._id.toString() !== req.body.playerIdWhoLeft) {
        const notification = new Notification({
          userId: player._id,
          type: 'game_abandoned',
          title: 'Oyundan Vazgeçildi',
          message: 'Oyun ortadan kesildi',
          relatedGameSessionId: sessionId,
          isRead: false
        });
        notification.save();
      }
    });

    res.json({
      success: true,
      message: 'Oyundan çıkıldı'
    });
  } catch (error) {
    console.error('Oyundan çıkış hatası:', error);
    res.status(500).json({ message: 'Hata oluştu', error: error.message });
  }
});

module.exports = router;
