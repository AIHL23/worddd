const mongoose = require('mongoose');

const pointsHistorySchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentClass: { type: String, required: true },
  pointsBefore: { type: Number, default: 0 },
  pointsAfter: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  action: { 
    type: String, 
    enum: ['word_added', 'word_approved', 'sentence_added', 'sentence_approved', 'word_voted', 'game_played'],
    required: true
  },
  actionId: { type: String },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

pointsHistorySchema.index({ studentId: 1, date: -1 });
pointsHistorySchema.index({ date: -1 });

module.exports = mongoose.model('PointsHistory', pointsHistorySchema);
