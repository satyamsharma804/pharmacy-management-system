const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'pharmacist', 'cashier'], default: 'cashier' },
  phone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Virtual id for frontend compatibility
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);

