const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');

// GET /api/medicines - List with search & filters
router.get('/', async (req, res) => {
  try {
    const { search, category, low_stock, expiring_soon, composition, gst_rate } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { generic_name: { $regex: search, $options: 'i' } },
        { batch_number: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (composition) {
      filter.generic_name = { $regex: composition, $options: 'i' };
    }

    if (gst_rate !== undefined && gst_rate !== '') {
      filter.gst_rate = Number(gst_rate);
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (low_stock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$min_stock_level'] };
    }

    if (expiring_soon === 'true') {
      const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      filter.expiry_date = { $lte: in30Days };
    }

    const medicines = await Medicine.find(filter).sort({ name: 1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/medicines/substitutes/:id - Find alternative brands with the same generic salt/composition
router.get('/substitutes/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

    if (!medicine.generic_name || medicine.generic_name.trim() === '') {
      return res.json({
        primary: medicine,
        composition: '',
        substitutes: [],
        message: 'No generic composition defined for this medicine'
      });
    }

    // Escape regex special chars in generic_name for accurate matching
    const escaped = medicine.generic_name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const substitutes = await Medicine.find({
      _id: { $ne: medicine._id },
      generic_name: { $regex: new RegExp(`^${escaped}$`, 'i') }
    }).sort({ selling_price: 1, quantity: -1 });

    res.json({
      primary: medicine,
      composition: medicine.generic_name,
      strength: medicine.strength,
      substitutes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/medicines/by-composition - Search medicines by active generic salt
router.get('/by-composition', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const medicines = await Medicine.find({
      generic_name: { $regex: query, $options: 'i' }
    }).sort({ selling_price: 1 });

    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/medicines/meta/categories - Distinct categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Medicine.distinct('category');
    res.json(categories.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/medicines/alerts/summary
router.get('/alerts/summary', async (req, res) => {
  try {
    const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const lowStock = await Medicine.find({
      $expr: { $lte: ['$quantity', '$min_stock_level'] }
    }).sort({ quantity: 1 });

    const expiringSoon = await Medicine.find({
      expiry_date: { $lte: in30Days }
    }).sort({ expiry_date: 1 });

    res.json({
      low_stock: lowStock,
      expiring_soon: expiringSoon,
      total_alerts: lowStock.length + expiringSoon.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/medicines/:id
router.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/medicines - Create medicine
router.post('/', async (req, res) => {
  try {
    const {
      name,
      generic_name,
      category,
      batch_number,
      hsn_code = '3004',
      gst_rate = 12,
      mrp,
      supplier_id,
      purchase_price,
      selling_price,
      quantity,
      min_stock_level = 10,
      expiry_date,
      dosage_form = 'Tablet',
      strength,
      location_shelf,
      description
    } = req.body;

    if (!name || !category || !batch_number || selling_price === undefined || !expiry_date) {
      return res.status(400).json({ error: 'Required fields: name, category, batch_number, selling_price, expiry_date' });
    }

    const existing = await Medicine.findOne({ batch_number });
    if (existing) {
      return res.status(400).json({ error: `Medicine with batch number '${batch_number}' already exists.` });
    }

    let supplierName = '';
    if (supplier_id) {
      const sup = await Supplier.findById(supplier_id);
      if (sup) supplierName = sup.name;
    }

    const medicine = await Medicine.create({
      name,
      generic_name: generic_name || '',
      category,
      batch_number,
      hsn_code: String(hsn_code || '3004').trim(),
      gst_rate: Number(gst_rate ?? 12),
      mrp: Number(mrp || selling_price),
      supplier: supplier_id || null,
      supplier_name: supplierName,
      purchase_price: Number(purchase_price || 0),
      selling_price: Number(selling_price),
      quantity: Number(quantity || 0),
      min_stock_level: Number(min_stock_level || 10),
      expiry_date,
      dosage_form,
      strength: strength || '',
      location_shelf: location_shelf || '',
      description: description || ''
    });

    res.status(201).json(medicine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/medicines/:id - Update medicine
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findById(id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

    let supplierName = medicine.supplier_name;
    if (req.body.supplier_id && req.body.supplier_id !== String(medicine.supplier)) {
      const sup = await Supplier.findById(req.body.supplier_id);
      if (sup) supplierName = sup.name;
    }

    const updateData = {
      ...req.body,
      supplier_name: supplierName
    };

    if (req.body.purchase_price !== undefined) updateData.purchase_price = Number(req.body.purchase_price);
    if (req.body.selling_price !== undefined) updateData.selling_price = Number(req.body.selling_price);
    if (req.body.mrp !== undefined) updateData.mrp = Number(req.body.mrp);
    if (req.body.gst_rate !== undefined) updateData.gst_rate = Number(req.body.gst_rate);
    if (req.body.hsn_code !== undefined) updateData.hsn_code = String(req.body.hsn_code).trim();
    if (req.body.quantity !== undefined) updateData.quantity = Number(req.body.quantity);
    if (req.body.min_stock_level !== undefined) updateData.min_stock_level = Number(req.body.min_stock_level);

    const updated = await Medicine.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/medicines/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Medicine.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Medicine not found' });
    res.json({ message: 'Medicine deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
