const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  playerStudentIds: [String],
  gameType: { type: String, default: 'collaboration' },
  mode: { type: String, enum: ['solo', 'multiplayer'], default: 'solo' },
  status: { type: String, enum: ['waiting', 'active', 'completed', 'abandoned'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  duration: { type: Number },
  words: [{
    wordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Word' },
    word: String,
    meaning: String,
    answered: Boolean,
    correctAnswer: String
  }],
  playerQuestionMapping: [{
    studentId: String,
    questionIndices: [Number]
  }],
  playerScores: [{
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentId: String,
    playerName: String,
    score: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    totalAnswered: { type: Number, default: 0 }
  }],
  currentPlayerIndex: { type: Number, default: 0 },
  currentWordIndex: { type: Number, default: 0 },
  winnerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalPoints: { type: Number, default: 0 },
  language: { type: String, default: 'all' }
}, { timestamps: true, versionKey: false });

gameSessionSchema.index({ players: 1, status: 1 });
gameSessionSchema.index({ startedAt: -1 });
gameSessionSchema.index({ status: 1, completedAt: -1 });

module.exports = mongoose.model('GameSession', gameSessionSchema);
