const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentClass: { type: String, required: true },
  
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['suggestion', 'bug', 'complaint', 'praise'], 
    default: 'suggestion' 
  },
  
  status: {
    type: String,
    enum: ['pending', 'answered', 'closed'],
    default: 'pending'
  },
  
  adminReply: {
    adminId: String,
    adminName: String,
    message: String,
    repliedAt: Date
  },
  
  studentRead: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
