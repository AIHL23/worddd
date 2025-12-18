const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  adminId: { type: String, required: true },
  adminName: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'warning', 'success', 'urgent'],
    default: 'info'
  },
  priority: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 10 
  },
  targetAudience: { 
    type: String, 
    enum: ['all', 'class', 'individual'],
    default: 'all'
  },
  targetClass: { type: String, default: null },
  targetStudentId: { type: String, default: null },
  isRead: [{
    studentId: String,
    readAt: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
