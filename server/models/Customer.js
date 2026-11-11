const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  allergies: { type: String, default: 'None' },
  createdAt: { type: Date, default: Date.now }
});

customerSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
customerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);

