const express = require('express');
const router = express.Router();
const { all, get, run } = require('../db/database');

// GET /api/medicines - List with search & filters
router.get('/', (req, res) => {
  try {
    const { search, category, low_stock, expiring_soon } = req.query;
    let sql = `
      SELECT m.*, s.name as supplier_name 
      FROM medicines m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (m.name LIKE ? OR m.generic_name LIKE ? OR m.batch_number LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (category && category !== 'All') {
      sql += ` AND m.category = ?`;
      params.push(category);
    }

    if (low_stock === 'true') {
      sql += ` AND m.quantity <= m.min_stock_level`;
    }

    if (expiring_soon === 'true') {
      // Expiring within 30 days
      sql += ` AND m.expiry_date <= date('now', '+30 days')`;
    }

    sql += ` ORDER BY m.name ASC`;

    const medicines = all(sql, params);
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/medicines/categories - Distinct categories
router.get('/meta/categories', (req, res) => {
  try {
    const rows = all(`SELECT DISTINCT category FROM medicines WHERE category IS NOT NULL ORDER BY category ASC`);
    const categories = rows.map(r => r.category);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/medicines/alerts/summary
router.get('/alerts/summary', (req, res) => {
  try {
    const lowStock = all(`
      SELECT id, name, batch_number, quantity, min_stock_level, location_shelf 
      FROM medicines 
      WHERE quantity <= min_stock_level 
      ORDER BY quantity ASC
    `);

    const expiringSoon = all(`
      SELECT id, name, batch_number, quantity, expiry_date, location_shelf 
      FROM medicines 
      WHERE expiry_date <= date('now', '+30 days') 
      ORDER BY expiry_date ASC
    `);

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
router.get('/:id', (req, res) => {
  try {
    const medicine = get(`
      SELECT m.*, s.name as supplier_name 
      FROM medicines m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE m.id = ?
    `, [req.params.id]);

    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/medicines - Create medicine
router.post('/', (req, res) => {
  try {
    const {
      name,
      generic_name,
      category,
      batch_number,
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

    const existingBatch = get('SELECT id FROM medicines WHERE batch_number = ?', [batch_number]);
    if (existingBatch) {
      return res.status(400).json({ error: `Medicine with batch number '${batch_number}' already exists.` });
    }

    const result = run(`
      INSERT INTO medicines (
        name, generic_name, category, batch_number, supplier_id,
        purchase_price, selling_price, quantity, min_stock_level,
        expiry_date, dosage_form, strength, location_shelf, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      generic_name || '',
      category,
      batch_number,
      supplier_id ? Number(supplier_id) : null,
      Number(purchase_price || 0),
      Number(selling_price),
      Number(quantity || 0),
      Number(min_stock_level || 10),
      expiry_date,
      dosage_form,
      strength || '',
      location_shelf || '',
      description || ''
    ]);

    const created = get('SELECT * FROM medicines WHERE id = ?', [Number(result.lastInsertRowid)]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/medicines/:id - Update medicine
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = get('SELECT * FROM medicines WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Medicine not found' });

    const {
      name = existing.name,
      generic_name = existing.generic_name,
      category = existing.category,
      batch_number = existing.batch_number,
      supplier_id = existing.supplier_id,
      purchase_price = existing.purchase_price,
      selling_price = existing.selling_price,
      quantity = existing.quantity,
      min_stock_level = existing.min_stock_level,
      expiry_date = existing.expiry_date,
      dosage_form = existing.dosage_form,
      strength = existing.strength,
      location_shelf = existing.location_shelf,
      description = existing.description
    } = req.body;

    run(`
      UPDATE medicines SET
        name = ?, generic_name = ?, category = ?, batch_number = ?,
        supplier_id = ?, purchase_price = ?, selling_price = ?, quantity = ?,
        min_stock_level = ?, expiry_date = ?, dosage_form = ?, strength = ?,
        location_shelf = ?, description = ?
      WHERE id = ?
    `, [
      name, generic_name, category, batch_number,
      supplier_id ? Number(supplier_id) : null,
      Number(purchase_price), Number(selling_price), Number(quantity),
      Number(min_stock_level), expiry_date, dosage_form, strength,
      location_shelf, description, id
    ]);

    const updated = get('SELECT * FROM medicines WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/medicines/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = get('SELECT id FROM medicines WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Medicine not found' });

    run('DELETE FROM medicines WHERE id = ?', [id]);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

