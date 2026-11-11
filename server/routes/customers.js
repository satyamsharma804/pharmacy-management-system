const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

// GET /api/customers
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    const customersWithStats = await Promise.all(
      customers.map(async (c) => {
        const sales = await Sale.find({
          $or: [{ customer: c._id }, { customer_phone: c.phone }]
        });
        const totalSpent = sales.reduce((sum, s) => sum + s.total_amount, 0);
        const obj = c.toJSON();
        obj.total_orders = sales.length;
        obj.total_spent = parseFloat(totalSpent.toFixed(2));
        return obj;
      })
    );

    res.json(customersWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const orders = await Sale.find({
      $or: [{ customer: customer._id }, { customer_phone: customer.phone }]
    }).sort({ createdAt: -1 });

    const obj = customer.toJSON();
    obj.orders = orders;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, allergies } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and phone number are required' });
    }

    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ error: 'A customer with this phone number already exists' });
    }

    const created = await Customer.create({
      name,
      phone: phone.trim(),
      email: email || '',
      address: address || '',
      allergies: allergies || 'None'
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
