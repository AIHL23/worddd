const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // 'game_invite', 'game_invite_accepted', 'game_invite_rejected', 'system', etc.
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedGameInvitationId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameInvitation' },
  relatedGameSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for faster queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
