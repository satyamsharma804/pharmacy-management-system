const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact_person: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, required: true },
  address: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

supplierSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
supplierSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Supplier', supplierSchema);

