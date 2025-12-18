const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  class: { type: String, required: true },
  profilePhoto: { type: String, default: '' },
  avatar: { type: String, default: '😊' },
  points: { type: Number, default: 0 },
  isFirstLogin: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: '' },
  banUntil: { type: Date },
  role: { type: String, enum: ['student', 'admin', 'teacher'], default: 'student' },
  lastLogin: { type: Date, default: Date.now },
  dailyStreak: { type: Number, default: 0 },
  streakLastDate: { type: Date },
  streakBonusPoints: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  totalGameTime: { type: Number, default: 0 },
  weeklyPointsHistory: [{
    week: Number,
    year: Number,
    points: Number,
    date: { type: Date, default: Date.now }
  }],
  dailyPointsHistory: [{
    date: Date,
    points: Number,
    pointsEarned: Number
  }],
  studentNotes: [{
    note: String,
    addedBy: String,
    addedAt: { type: Date, default: Date.now }
  }],
  kvkkApproved: { type: Boolean, default: false },
  kvkkApprovedAt: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Eğer şifre zaten bcrypt ile hash'lenmişse ($ ile başlarsa), tekrar hash'leme
  if (this.password.startsWith('$2')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);