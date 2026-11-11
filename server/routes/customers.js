const express = require('express');
const router = express.Router();
const { all, get, run } = require('../db/database');

// GET /api/customers - List of customers with total purchases
router.get('/', (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT c.*, 
             COUNT(s.id) as total_orders, 
             COALESCE(SUM(s.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` GROUP BY c.id ORDER BY c.created_at DESC`;

    const customers = all(sql, params);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id
router.get('/:id', (req, res) => {
  try {
    const customer = get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const orders = all(`
      SELECT s.*, 
             (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
      FROM sales s 
      WHERE s.customer_id = ? 
      ORDER BY s.created_at DESC
    `, [req.params.id]);

    res.json({ ...customer, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers
router.post('/', (req, res) => {
  try {
    const { name, phone, email, address, allergies } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and phone number are required' });
    }

    const existing = get('SELECT id FROM customers WHERE phone = ?', [phone]);
    if (existing) {
      return res.status(400).json({ error: 'A customer with this phone number already exists' });
    }

    const result = run(`
      INSERT INTO customers (name, phone, email, address, allergies)
      VALUES (?, ?, ?, ?, ?)
    `, [name, phone, email || '', address || '', allergies || 'None']);

    const created = get('SELECT * FROM customers WHERE id = ?', [Number(result.lastInsertRowid)]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Customer not found' });

    const {
      name = existing.name,
      phone = existing.phone,
      email = existing.email,
      address = existing.address,
      allergies = existing.allergies
    } = req.body;

    run(`
      UPDATE customers SET
        name = ?, phone = ?, email = ?, address = ?, allergies = ?
      WHERE id = ?
    `, [name, phone, email, address, allergies, id]);

    const updated = get('SELECT * FROM customers WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = get('SELECT id FROM customers WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Customer not found' });

    run('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ message: 'Customer record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

