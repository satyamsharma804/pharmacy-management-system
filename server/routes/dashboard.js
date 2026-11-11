const express = require('express');
const router = express.Router();
const { all, get } = require('../db/database');

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  try {
    // 1. Overall Metrics
    const totalRev = get(`SELECT COALESCE(SUM(total_amount), 0) as total FROM sales`);
    const todayRev = get(`
      SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(id) as count 
      FROM sales 
      WHERE date(created_at) = date('now')
    `);

    const medCounts = get(`
      SELECT 
        COUNT(id) as total_medicines,
        COALESCE(SUM(quantity), 0) as total_units
      FROM medicines
    `);

    const lowStock = get(`
      SELECT COUNT(id) as count 
      FROM medicines 
      WHERE quantity <= min_stock_level
    `);

    const expiringSoon = get(`
      SELECT COUNT(id) as count 
      FROM medicines 
      WHERE expiry_date <= date('now', '+30 days')
    `);

    const customerCount = get(`SELECT COUNT(id) as count FROM customers`);
    const supplierCount = get(`SELECT COUNT(id) as count FROM suppliers`);

    // 2. Recent Sales
    const recentSales = all(`
      SELECT s.id, s.invoice_number, s.customer_name, s.total_amount, 
             s.payment_method, s.created_at,
             (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
      FROM sales s
      ORDER BY s.created_at DESC
      LIMIT 6
    `);

    // 3. Weekly Sales Chart Data (Past 7 Days)
    const salesChart = all(`
      WITH RECURSIVE dates(d) AS (
        SELECT date('now', '-6 days')
        UNION ALL
        SELECT date(d, '+1 day') FROM dates WHERE d < date('now')
      )
      SELECT 
        strftime('%d %b', dates.d) as date,
        dates.d as raw_date,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        COUNT(s.id) as transactions
      FROM dates
      LEFT JOIN sales s ON date(s.created_at) = dates.d
      GROUP BY dates.d
      ORDER BY dates.d ASC
    `);

    // 4. Category breakdown
    const categoryStats = all(`
      SELECT category, COUNT(id) as count, SUM(quantity) as total_stock
      FROM medicines
      GROUP BY category
      ORDER BY count DESC
      LIMIT 6
    `);

    // 5. Urgent Stock Alert Previews
    const lowStockItems = all(`
      SELECT id, name, quantity, min_stock_level, location_shelf, batch_number
      FROM medicines
      WHERE quantity <= min_stock_level
      ORDER BY quantity ASC
      LIMIT 4
    `);

    const expiringItems = all(`
      SELECT id, name, batch_number, quantity, expiry_date, location_shelf
      FROM medicines
      WHERE expiry_date <= date('now', '+30 days')
      ORDER BY expiry_date ASC
      LIMIT 4
    `);

    res.json({
      revenue: {
        total: totalRev ? totalRev.total : 0,
        today: todayRev ? todayRev.total : 0,
        today_orders: todayRev ? todayRev.count : 0
      },
      inventory: {
        total_medicines: medCounts ? medCounts.total_medicines : 0,
        total_units: medCounts ? medCounts.total_units : 0,
        low_stock_count: lowStock ? lowStock.count : 0,
        expiring_soon_count: expiringSoon ? expiringSoon.count : 0
      },
      counts: {
        customers: customerCount ? customerCount.count : 0,
        suppliers: supplierCount ? supplierCount.count : 0
      },
      recent_sales: recentSales,
      sales_chart: salesChart,
      category_stats: categoryStats,
      alerts: {
        low_stock: lowStockItems,
        expiring_soon: expiringItems
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

