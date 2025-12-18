const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  adminName: { type: String, required: true },
  action: { 
    type: String, 
    enum: ['word_approve', 'word_reject', 'sentence_approve', 'sentence_reject', 'user_ban', 'user_unban', 'announcement_post', 'announcement_delete', 'user_delete'],
    required: true 
  },
  targetId: { type: String }, 
  targetName: { type: String },
  details: { type: String },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['success', 'error'], default: 'success' },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AdminLog', adminLogSchema);
