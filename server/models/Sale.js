const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  medicine_id: { type: String, required: true },
  medicine_name: { type: String, required: true },
  generic_name: { type: String, default: '' },
  batch_number: { type: String, default: '' },
  hsn_code: { type: String, default: '3004' },
  gst_rate: { type: Number, default: 12 }, // 0, 5, 12, 18
  mrp: { type: Number, default: 0 },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  taxable_amount: { type: Number, default: 0 },
  gst_amount: { type: Number, default: 0 },
  cgst_amount: { type: Number, default: 0 },
  sgst_amount: { type: Number, default: 0 },
  total_price: { type: Number, required: true },
  dosage_form: { type: String, default: 'Tablet' },
  strength: { type: String, default: '' }
}, { _id: false });

const gstBreakupSchema = new mongoose.Schema({
  gst_rate: { type: Number, required: true }, // e.g. 0, 5, 12, 18
  taxable_amount: { type: Number, required: true },
  cgst_rate: { type: Number, required: true }, // e.g. 2.5
  cgst_amount: { type: Number, required: true },
  sgst_rate: { type: Number, required: true }, // e.g. 2.5
  sgst_amount: { type: Number, required: true },
  total_tax: { type: Number, required: true },
  total_amount: { type: Number, required: true }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  invoice_number: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.Mixed, ref: 'Customer', default: null },
  customer_name: { type: String, default: 'Walk-in Customer' },
  customer_phone: { type: String, default: '' },
  pharmacist: { type: mongoose.Schema.Types.Mixed, ref: 'User', default: null },
  pharmacist_name: { type: String, default: 'Satyam Kumar' },
  items: [saleItemSchema],
  gst_breakup: [gstBreakupSchema],
  subtotal: { type: Number, required: true },
  discount_percentage: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  total_cgst: { type: Number, default: 0 },
  total_sgst: { type: Number, default: 0 },
  total_tax: { type: Number, default: 0 },
  total_mrp: { type: Number, default: 0 },
  total_savings: { type: Number, default: 0 },
  total_amount: { type: Number, required: true },
  payment_method: { type: String, default: 'Cash' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

saleSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
saleSchema.virtual('total_items').get(function() {
  return this.items ? this.items.length : 0;
});
saleSchema.virtual('total_quantity').get(function() {
  return this.items ? this.items.reduce((sum, it) => sum + (it.quantity || 0), 0) : 0;
});
saleSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Sale', saleSchema);
