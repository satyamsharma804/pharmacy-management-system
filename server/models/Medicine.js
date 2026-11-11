const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  generic_name: { type: String, default: '' },
  category: { type: String, required: true },
  batch_number: { type: String, required: true, unique: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  supplier_name: { type: String, default: '' },
  purchase_price: { type: Number, default: 0 },
  selling_price: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  min_stock_level: { type: Number, default: 10 },
  expiry_date: { type: String, required: true }, // YYYY-MM-DD
  dosage_form: { type: String, default: 'Tablet' },
  strength: { type: String, default: '' },
  location_shelf: { type: String, default: '' },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

medicineSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
medicineSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Medicine', medicineSchema);

