const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  medicine_id: { type: String, required: true },
  medicine_name: { type: String, required: true },
  batch_number: { type: String, default: '' },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  total_price: { type: Number, required: true },
  dosage_form: { type: String, default: 'Tablet' },
  strength: { type: String, default: '' }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  invoice_number: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_name: { type: String, default: 'Walk-in Customer' },
  customer_phone: { type: String, default: '' },
  pharmacist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pharmacist_name: { type: String, default: 'Satyam Kumar' },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  discount_percentage: { type: Number, default: 0 },
  tax_percentage: { type: Number, default: 5 },
  total_amount: { type: Number, required: true },
  payment_method: { type: String, enum: ['Cash', 'Card', 'UPI'], default: 'Cash' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

saleSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
saleSchema.virtual('total_items').get(function() {
  return this.items ? this.items.length : 0;
});
saleSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Sale', saleSchema);
