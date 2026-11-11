const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const Customer = require('../models/Customer');

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

    // 1. Verify stock availability and compute item-level Indian GST breakdown
    const discountMultiplier = 1 - (Number(discount_percentage) / 100);
    const verifiedItems = [];
    let subtotal = 0;
    let totalTax = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalMrp = 0;

    // Grouping by GST slab for the DMart-style GST Breakup table (0%, 5%, 12%, 18%)
    const slabGroups = {
      0: { gst_rate: 0, taxable_amount: 0, cgst_rate: 0, cgst_amount: 0, sgst_rate: 0, sgst_amount: 0, total_tax: 0, total_amount: 0 },
      5: { gst_rate: 5, taxable_amount: 0, cgst_rate: 2.5, cgst_amount: 0, sgst_rate: 2.5, sgst_amount: 0, total_tax: 0, total_amount: 0 },
      12: { gst_rate: 12, taxable_amount: 0, cgst_rate: 6.0, cgst_amount: 0, sgst_rate: 6.0, sgst_amount: 0, total_tax: 0, total_amount: 0 },
      18: { gst_rate: 18, taxable_amount: 0, cgst_rate: 9.0, cgst_amount: 0, sgst_rate: 9.0, sgst_amount: 0, total_tax: 0, total_amount: 0 }
    };

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

      const qty = Number(item.quantity);
      const unitPrice = Number(med.selling_price);
      const itemMrp = Number(med.mrp || med.selling_price * 1.15); // Fallback to 15% above selling if not entered
      const itemTotalBeforeDiscount = unitPrice * qty;
      subtotal += itemTotalBeforeDiscount;
      totalMrp += itemMrp * qty;

      // Item's post-discount taxable value
      const itemTaxable = parseFloat((itemTotalBeforeDiscount * discountMultiplier).toFixed(2));
      const gstRate = Number(med.gst_rate !== undefined ? med.gst_rate : 12);
      const hsnCode = med.hsn_code || '3004';

      const cgstRate = gstRate / 2;
      const sgstRate = gstRate / 2;
      const itemCgst = parseFloat((itemTaxable * (cgstRate / 100)).toFixed(2));
      const itemSgst = parseFloat((itemTaxable * (sgstRate / 100)).toFixed(2));
      const itemGst = parseFloat((itemCgst + itemSgst).toFixed(2));
      const itemFinalTotal = parseFloat((itemTaxable + itemGst).toFixed(2));

      totalCgst += itemCgst;
      totalSgst += itemSgst;
      totalTax += itemGst;

      if (!slabGroups[gstRate]) {
        slabGroups[gstRate] = {
          gst_rate: gstRate,
          taxable_amount: 0,
          cgst_rate: cgstRate,
          cgst_amount: 0,
          sgst_rate: sgstRate,
          sgst_amount: 0,
          total_tax: 0,
          total_amount: 0
        };
      }
      slabGroups[gstRate].taxable_amount = parseFloat((slabGroups[gstRate].taxable_amount + itemTaxable).toFixed(2));
      slabGroups[gstRate].cgst_amount = parseFloat((slabGroups[gstRate].cgst_amount + itemCgst).toFixed(2));
      slabGroups[gstRate].sgst_amount = parseFloat((slabGroups[gstRate].sgst_amount + itemSgst).toFixed(2));
      slabGroups[gstRate].total_tax = parseFloat((slabGroups[gstRate].total_tax + itemGst).toFixed(2));
      slabGroups[gstRate].total_amount = parseFloat((slabGroups[gstRate].total_amount + itemFinalTotal).toFixed(2));

      verifiedItems.push({
        medicine_id: med._id.toString(),
        medicine_name: med.name,
        generic_name: med.generic_name || '',
        batch_number: med.batch_number,
        hsn_code: hsnCode,
        gst_rate: gstRate,
        mrp: itemMrp,
        quantity: qty,
        unit_price: unitPrice,
        taxable_amount: itemTaxable,
        gst_amount: itemGst,
        cgst_amount: itemCgst,
        sgst_amount: itemSgst,
        total_price: itemFinalTotal,
        dosage_form: med.dosage_form,
        strength: med.strength
      });
    }

    const discountAmount = parseFloat((subtotal * (Number(discount_percentage) / 100)).toFixed(2));
    const grandTotal = parseFloat((subtotal - discountAmount + totalTax).toFixed(2));
    const totalSavings = parseFloat(Math.max(0, (totalMrp - grandTotal)).toFixed(2));

    // Convert non-empty slab groups to array
    const gstBreakup = Object.values(slabGroups).filter(g => g.taxable_amount > 0);

    // Generate unique invoice number: INV-YYYYMMDD-Random
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${todayStr}-${randNum}`;

    // 2. Resolve or automatically create Customer in the database
    let cleanPhone = customer_phone ? String(customer_phone).trim() : '';
    let cleanName = customer_name ? String(customer_name).trim() : '';
    let finalCustomerId = customer_id || null;

    if (cleanPhone) {
      try {
        let existingCust = null;
        if (finalCustomerId) {
          existingCust = await Customer.findById(finalCustomerId);
        }
        if (!existingCust) {
          existingCust = await Customer.findOne({ phone: cleanPhone });
        }

        if (existingCust) {
          finalCustomerId = existingCust._id;
          // Update customer name if provided and existing was generic
          if (cleanName && cleanName !== 'Customer' && cleanName !== 'Walk-in Customer') {
            if (!existingCust.name || existingCust.name === 'Customer' || existingCust.name === 'Walk-in Customer') {
              existingCust.name = cleanName;
              await existingCust.save();
            } else {
              cleanName = existingCust.name; // Use existing registered customer name
            }
          } else {
            cleanName = existingCust.name;
          }
        } else {
          // Customer does not exist yet -> Create new customer record in MongoDB Atlas!
          const newCust = await Customer.create({
            name: cleanName || 'Customer',
            phone: cleanPhone,
            email: '',
            address: '',
            allergies: 'None'
          });
          finalCustomerId = newCust._id;
          cleanName = newCust.name;
          console.log(`Registered new customer in MongoDB Atlas: ${newCust.name} (${newCust.phone})`);
        }
      } catch (custErr) {
        console.error('Customer auto-link notice:', custErr.message);
      }
    }

    if (!cleanName) {
      cleanName = cleanPhone ? 'Customer' : 'Walk-in Customer';
    }

    // 3. Resolve Pharmacist
    let pharmacistName = 'Satyam Kumar';
    let finalPharmacistId = null;
    if (pharmacist_id) {
      try {
        const ph = await User.findById(pharmacist_id);
        if (ph) {
          pharmacistName = ph.name;
          finalPharmacistId = ph._id;
        }
      } catch (e) {}
    }

    // 4. Deduct stock for each medicine
    for (const item of verifiedItems) {
      await Medicine.findByIdAndUpdate(item.medicine_id, {
        $inc: { quantity: -item.quantity }
      });
    }

    // 5. Create and save Sale record with DMart-style GST and MRP Savings
    const sale = await Sale.create({
      invoice_number: invoiceNumber,
      customer: finalCustomerId,
      customer_name: cleanName,
      customer_phone: cleanPhone,
      pharmacist: finalPharmacistId,
      pharmacist_name: pharmacistName,
      items: verifiedItems,
      gst_breakup: gstBreakup,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount_percentage: Number(discount_percentage),
      discount_amount: discountAmount,
      total_cgst: parseFloat(totalCgst.toFixed(2)),
      total_sgst: parseFloat(totalSgst.toFixed(2)),
      total_tax: parseFloat(totalTax.toFixed(2)),
      total_mrp: parseFloat(totalMrp.toFixed(2)),
      total_savings: totalSavings,
      total_amount: grandTotal,
      payment_method,
      notes
    });

    console.log(`Sale successfully saved to MongoDB Atlas: ${sale.invoice_number} | Customer: ${cleanName} (${cleanPhone}) | Amount: ₹${grandTotal} | Saved on MRP: ₹${totalSavings}`);

    res.status(201).json({
      message: 'Transaction completed successfully',
      invoice: sale
    });
  } catch (err) {
    console.error('Sale transaction error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
