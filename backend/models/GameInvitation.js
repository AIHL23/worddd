const mongoose = require('mongoose');

const gameInvitationSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromStudentId: { type: String, required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toStudentId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  gameType: { type: String, default: 'collaboration' },
  gameSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
}, { timestamps: true });

gameInvitationSchema.index({ toStudentId: 1, status: 1 });
gameInvitationSchema.index({ fromStudentId: 1, createdAt: -1 });
gameInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('GameInvitation', gameInvitationSchema);
