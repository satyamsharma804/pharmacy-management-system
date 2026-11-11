const express = require('express');
const router = express.Router();
const { all, get, run } = require('../db/database');

// GET /api/suppliers - With count of supplied medicines
router.get('/', (req, res) => {
  try {
    const suppliers = all(`
      SELECT s.*, COUNT(m.id) as medicines_count
      FROM suppliers s
      LEFT JOIN medicines m ON s.id = m.supplier_id
      GROUP BY s.id
      ORDER BY s.name ASC
    `);
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/suppliers/:id - Single supplier with their medicines
router.get('/:id', (req, res) => {
  try {
    const supplier = get('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    const medicines = all('SELECT * FROM medicines WHERE supplier_id = ? ORDER BY name ASC', [req.params.id]);
    res.json({ ...supplier, medicines });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/suppliers
router.post('/', (req, res) => {
  try {
    const { name, contact_person, email, phone, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Supplier name and phone number are required' });
    }

    const result = run(`
      INSERT INTO suppliers (name, contact_person, email, phone, address)
      VALUES (?, ?, ?, ?, ?)
    `, [name, contact_person || '', email || '', phone, address || '']);

    const created = get('SELECT * FROM suppliers WHERE id = ?', [Number(result.lastInsertRowid)]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = get('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Supplier not found' });

    const {
      name = existing.name,
      contact_person = existing.contact_person,
      email = existing.email,
      phone = existing.phone,
      address = existing.address
    } = req.body;

    run(`
      UPDATE suppliers SET
        name = ?, contact_person = ?, email = ?, phone = ?, address = ?
      WHERE id = ?
    `, [name, contact_person, email, phone, address, id]);

    const updated = get('SELECT * FROM suppliers WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = get('SELECT id FROM suppliers WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Supplier not found' });

    run('DELETE FROM suppliers WHERE id = ?', [id]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

