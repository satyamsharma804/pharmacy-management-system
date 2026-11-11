const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const User = require('../models/User');

// GET /api/sales - List all transactions
router.get('/', async (req, res) => {
  try {
    const { search, payment_method } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { invoice_number: { $regex: search, $options: 'i' } },
        { customer_name: { $regex: search, $options: 'i' } },
        { customer_phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (payment_method && payment_method !== 'All') {
      filter.payment_method = payment_method;
    }

    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sales/:id - Sale details with line items
router.get('/:id', async (req, res) => {
  try {
    let sale = null;
    if (req.params.id.startsWith('INV-')) {
      sale = await Sale.findOne({ invoice_number: req.params.id });
    } else {
      sale = await Sale.findById(req.params.id);
    }

    if (!sale) return res.status(404).json({ error: 'Invoice not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sales - Process POS transaction
router.post('/', async (req, res) => {
  try {
    const {
      customer_id,
      customer_name,
      customer_phone,
      pharmacist_id,
      items, // array of { medicine_id, quantity }
      discount_percentage = 0,
      tax_percentage = 5,
      payment_method = 'Cash',
      notes = ''
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty' });
    }

    // 1. Verify stock availability for all items
    const verifiedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const med = await Medicine.findById(item.medicine_id);
      if (!med) {
        return res.status(400).json({ error: `Medicine with ID ${item.medicine_id} not found` });
      }
      if (med.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${med.name}". Available: ${med.quantity}, Requested: ${item.quantity}`
        });
      }

      const itemTotal = Number(med.selling_price) * Number(item.quantity);
      subtotal += itemTotal;

      verifiedItems.push({
        medicine_id: med._id.toString(),
        medicine_name: med.name,
        batch_number: med.batch_number,
        quantity: Number(item.quantity),
        unit_price: Number(med.selling_price),
        total_price: itemTotal,
        dosage_form: med.dosage_form,
        strength: med.strength
      });
    }

    const discountAmount = subtotal * (Number(discount_percentage) / 100);
    const discountedTotal = subtotal - discountAmount;
    const taxAmount = discountedTotal * (Number(tax_percentage) / 100);
    const finalTotal = parseFloat((discountedTotal + taxAmount).toFixed(2));

    // Generate unique invoice number: INV-YYYYMMDD-Random
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${todayStr}-${randNum}`;

    // Get pharmacist name
    let pharmacistName = 'Satyam Kumar';
    if (pharmacist_id) {
      const ph = await User.findById(pharmacist_id);
      if (ph) pharmacistName = ph.name;
    }

    // Deduct stock for each medicine
    for (const item of verifiedItems) {
      await Medicine.findByIdAndUpdate(item.medicine_id, {
        $inc: { quantity: -item.quantity }
      });
    }

    // Create Sale record
    const sale = await Sale.create({
      invoice_number: invoiceNumber,
      customer: customer_id || null,
      customer_name: customer_name || 'Walk-in Customer',
      customer_phone: customer_phone || '',
      pharmacist: pharmacist_id || null,
      pharmacist_name: pharmacistName,
      items: verifiedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount_percentage: Number(discount_percentage),
      tax_percentage: Number(tax_percentage),
      total_amount: finalTotal,
      payment_method,
      notes
    });

    res.status(201).json({
      message: 'Transaction completed successfully',
      invoice: sale
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
