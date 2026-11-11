const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const Medicine = require('../models/Medicine');

// GET /api/suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    
    // Add count of supplied medicines
    const suppliersWithCount = await Promise.all(
      suppliers.map(async (s) => {
        const count = await Medicine.countDocuments({
          $or: [{ supplier: s._id }, { supplier_name: s.name }]
        });
        const obj = s.toJSON();
        obj.medicines_count = count;
        return obj;
      })
    );

    res.json(suppliersWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    const medicines = await Medicine.find({
      $or: [{ supplier: supplier._id }, { supplier_name: supplier.name }]
    }).sort({ name: 1 });

    const obj = supplier.toJSON();
    obj.medicines = medicines;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/suppliers
router.post('/', async (req, res) => {
  try {
    const { name, contact_person, email, phone, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Supplier name and phone number are required' });
    }

    const created = await Supplier.create({
      name,
      contact_person: contact_person || '',
      email: email || '',
      phone,
      address: address || ''
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Supplier not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Supplier.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
