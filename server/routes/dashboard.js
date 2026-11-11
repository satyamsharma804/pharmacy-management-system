const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Overall Metrics
    const [allSales, todaySales, medicines, customerCount, supplierCount] = await Promise.all([
      Sale.find().select('total_amount createdAt'),
      Sale.find({ createdAt: { $gte: todayStart } }),
      Medicine.find(),
      Customer.countDocuments(),
      Supplier.countDocuments()
    ]);

    const totalRev = allSales.reduce((sum, s) => sum + s.total_amount, 0);
    const todayRev = todaySales.reduce((sum, s) => sum + s.total_amount, 0);

    const totalMedicines = medicines.length;
    const totalUnits = medicines.reduce((sum, m) => sum + m.quantity, 0);
    const lowStockCount = medicines.filter(m => m.quantity <= m.min_stock_level).length;

    const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const expiringSoonCount = medicines.filter(m => m.expiry_date <= in30Days).length;

    // 2. Recent Sales
    const recentSales = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(6);

    // 3. Weekly Sales Chart Data (Past 7 Days)
    const salesChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const daySales = allSales.filter(s => s.createdAt >= startOfDay && s.createdAt <= endOfDay);
      const dayRev = daySales.reduce((sum, s) => sum + s.total_amount, 0);

      const dayLabel = startOfDay.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      salesChart.push({
        date: dayLabel,
        revenue: parseFloat(dayRev.toFixed(2)),
        transactions: daySales.length
      });
    }

    // 4. Category breakdown
    const categoryMap = {};
    medicines.forEach(m => {
      if (!categoryMap[m.category]) {
        categoryMap[m.category] = { category: m.category, count: 0, total_stock: 0 };
      }
      categoryMap[m.category].count += 1;
      categoryMap[m.category].total_stock += m.quantity;
    });
    const categoryStats = Object.values(categoryMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 5. Urgent Stock Alert Previews
    const lowStockItems = medicines
      .filter(m => m.quantity <= m.min_stock_level)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 4);

    const expiringItems = medicines
      .filter(m => m.expiry_date <= in30Days)
      .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date))
      .slice(0, 4);

    res.json({
      revenue: {
        total: parseFloat(totalRev.toFixed(2)),
        today: parseFloat(todayRev.toFixed(2)),
        today_orders: todaySales.length
      },
      inventory: {
        total_medicines: totalMedicines,
        total_units: totalUnits,
        low_stock_count: lowStockCount,
        expiring_soon_count: expiringSoonCount
      },
      counts: {
        customers: customerCount,
        suppliers: supplierCount
      },
      recent_sales: recentSales.map(s => s.toJSON()),
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
