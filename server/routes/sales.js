const express = require('express');
const router = express.Router();
const { db, all, get, run } = require('../db/database');

// GET /api/sales - List all transactions
router.get('/', (req, res) => {
  try {
    const { search, payment_method, start_date, end_date } = req.query;
    let sql = `
      SELECT s.*, 
             u.name as pharmacist_name,
             (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as total_items
      FROM sales s
      LEFT JOIN users u ON s.pharmacist_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (s.invoice_number LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (payment_method && payment_method !== 'All') {
      sql += ` AND s.payment_method = ?`;
      params.push(payment_method);
    }

    if (start_date) {
      sql += ` AND s.created_at >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      sql += ` AND s.created_at <= ?`;
      params.push(end_date);
    }

    sql += ` ORDER BY s.created_at DESC`;

    const sales = all(sql, params);
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sales/:id - Sale details with line items
router.get('/:id', (req, res) => {
  try {
    const sale = get(`
      SELECT s.*, u.name as pharmacist_name
      FROM sales s
      LEFT JOIN users u ON s.pharmacist_id = u.id
      WHERE s.id = ? OR s.invoice_number = ?
    `, [req.params.id, req.params.id]);

    if (!sale) return res.status(404).json({ error: 'Invoice not found' });

    const items = all(`
      SELECT si.*, m.dosage_form, m.strength
      FROM sale_items si
      LEFT JOIN medicines m ON si.medicine_id = m.id
      WHERE si.sale_id = ?
    `, [sale.id]);

    res.json({ ...sale, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sales - Process POS transaction
router.post('/', (req, res) => {
  try {
    const {
      customer_id,
      customer_name,
      customer_phone,
      pharmacist_id = 1,
      items, // array of { medicine_id, quantity }
      discount_percentage = 0,
      tax_percentage = 5,
      payment_method = 'Cash',
      notes = ''
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty' });
    }

    // 1. Verify stock availability for all items before writing
    const verifiedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const med = get('SELECT * FROM medicines WHERE id = ?', [item.medicine_id]);
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
        medicine_id: med.id,
        medicine_name: med.name,
        batch_number: med.batch_number,
        quantity: Number(item.quantity),
        unit_price: Number(med.selling_price),
        total_price: itemTotal,
        current_stock: med.quantity
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

    // Execute transaction in SQLite
    db.exec('BEGIN TRANSACTION;');

    try {
      // Insert into sales
      const saleResult = run(`
        INSERT INTO sales (
          invoice_number, customer_id, customer_name, customer_phone,
          pharmacist_id, subtotal, discount_percentage, tax_percentage,
          total_amount, payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoiceNumber,
        customer_id ? Number(customer_id) : null,
        customer_name || 'Walk-in Customer',
        customer_phone || '',
        Number(pharmacist_id),
        parseFloat(subtotal.toFixed(2)),
        Number(discount_percentage),
        Number(tax_percentage),
        finalTotal,
        payment_method,
        notes
      ]);

      const saleId = Number(saleResult.lastInsertRowid);

      // Insert sale items and deduct stock
      for (const item of verifiedItems) {
        run(`
          INSERT INTO sale_items (
            sale_id, medicine_id, medicine_name, batch_number, quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          saleId,
          item.medicine_id,
          item.medicine_name,
          item.batch_number,
          item.quantity,
          item.unit_price,
          item.total_price
        ]);

        run(`
          UPDATE medicines 
          SET quantity = quantity - ? 
          WHERE id = ?
        `, [item.quantity, item.medicine_id]);
      }

      db.exec('COMMIT;');

      const fullInvoice = {
        id: saleId,
        invoice_number: invoiceNumber,
        customer_name: customer_name || 'Walk-in Customer',
        customer_phone: customer_phone || '',
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount_percentage: Number(discount_percentage),
        tax_percentage: Number(tax_percentage),
        total_amount: finalTotal,
        payment_method,
        created_at: new Date().toISOString(),
        items: verifiedItems
      };

      res.status(201).json({
        message: 'Transaction completed successfully',
        invoice: fullInvoice
      });
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

