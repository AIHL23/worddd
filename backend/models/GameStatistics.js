const mongoose = require('mongoose');

const gameStatisticsSchema = new mongoose.Schema({
  gameType: { 
    type: String, 
    enum: ['flashcard', 'matching'],
    required: true
  },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentClass: { type: String, required: true },
  pointsEarned: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  wordCount: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('GameStatistics', gameStatisticsSchema);
