const bcrypt = require('bcryptjs');
const { db, all, get, run } = require('./database');

async function seed() {
  console.log('Seeding pharmacy database...');

  // Check if already seeded
  const userCount = get('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count > 0) {
    console.log('Database already has users. Skipping initial seed or refreshing if needed.');
    return;
  }

  // 1. Users
  const salt = bcrypt.genSaltSync(10);
  const adminPass = bcrypt.hashSync('admin123', salt);
  const pharmaPass = bcrypt.hashSync('pharma123', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('Satyam Kumar', 'satyam@pharmacy.com', adminPass, 'admin', '+91 98765 43210');
  insertUser.run('Admin Manager', 'admin@pharmacy.com', adminPass, 'admin', '+91 91234 56780');
  insertUser.run('Priya Sharma', 'pharmacist@pharmacy.com', pharmaPass, 'pharmacist', '+91 99887 76655');

  // 2. Suppliers
  const insertSupplier = db.prepare(`
    INSERT INTO suppliers (name, contact_person, email, phone, address)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertSupplier.run('Sun Pharma Distributors', 'Rajesh Gupta', 'orders@sunpharma.example.com', '+91 11 2345 6789', 'Plot 45, Okhla Industrial Area, New Delhi');
  insertSupplier.run('Cipla Healthcare Logistics', 'Anita Desai', 'supply@cipla.example.com', '+91 22 4567 8901', 'Bandra Kurla Complex, Mumbai');
  insertSupplier.run("Dr. Reddy's Laboratories", 'Vikram Patel', 'reddy.orders@drreddys.example.com', '+91 40 3456 7890', 'Ameerpet, Hyderabad');
  insertSupplier.run('Abbott India Direct', 'Kavita Singh', 'inquiry@abbott.example.com', '+91 80 5678 1234', 'Whitefield Tech Zone, Bangalore');
  insertSupplier.run('Mankind Pharma Hub', 'Deepak Verma', 'dist@mankind.example.com', '+91 120 4455 667', 'Sector 62, Noida');

  // 3. Customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, phone, email, address, allergies)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertCustomer.run('Rahul Verma', '+91 98111 22334', 'rahul.v@gmail.com', 'Flat 402, Green Glen Apartments, Delhi', 'Penicillin allergic');
  insertCustomer.run('Sneha Roy', '+91 97222 33445', 'sneha.roy@gmail.com', 'B-14 Rosewood Lane, Noida', 'None');
  insertCustomer.run('Amitabh Sen', '+91 96333 44556', 'amitabh.sen@yahoo.com', '55 Kailash Hills, New Delhi', 'Sulfa drugs');
  insertCustomer.run('Pooja Nair', '+91 95444 55667', 'pooja.nair@outlook.com', 'Sector 15, Gurgaon', 'None');
  insertCustomer.run('Rohan Mehta', '+91 94555 66778', 'rohan.m@gmail.com', 'C-3 Civil Lines, Delhi', 'Aspirin sensitive');

  // Helper date generators
  const now = new Date();
  const formatISO = (d) => d.toISOString().split('T')[0];
  
  const inDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return formatISO(d);
  };

  // 4. Medicines
  const insertMedicine = db.prepare(`
    INSERT INTO medicines (name, generic_name, category, batch_number, supplier_id, purchase_price, selling_price, quantity, min_stock_level, expiry_date, dosage_form, strength, location_shelf, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const medicinesData = [
    ['Paracetamol 650 (Dolo)', 'Acetaminophen', 'Analgesic / Antipyretic', 'DOL-8821', 1, 15.00, 30.00, 120, 20, inDays(365), 'Tablet', '650mg', 'Shelf A-1', 'Relief from mild-to-moderate pain and high fever'],
    ['Amoxicillin & Clavulanate (Augmentin)', 'Amoxicillin + Clavulanic Acid', 'Antibiotic', 'AUG-4491', 2, 95.00, 145.00, 45, 15, inDays(180), 'Tablet', '625mg', 'Shelf B-2', 'Broad spectrum antibacterial prescription'],
    ['Azithromycin 500 (Azee)', 'Azithromycin', 'Antibiotic', 'AZI-1029', 2, 70.00, 115.00, 8, 15, inDays(240), 'Tablet', '500mg', 'Shelf B-3', 'Low stock alert item for respiratory infections'],
    ['Cetirizine 10mg (Cetzine)', 'Cetirizine Hydrochloride', 'Antihistamine', 'CET-9942', 3, 12.00, 25.00, 80, 20, inDays(400), 'Tablet', '10mg', 'Shelf A-3', 'Allergy relief, sneezing, runny nose'],
    ['Metformin 500mg (Glycomet)', 'Metformin Hydrochloride', 'Antidiabetic', 'GLY-7731', 4, 22.00, 42.00, 95, 25, inDays(500), 'Tablet', '500mg', 'Shelf C-1', 'First line oral antidiabetic medicine'],
    ['Atorvastatin 10mg (Atorva)', 'Atorvastatin Calcium', 'Cardiovascular', 'ATO-3312', 4, 45.00, 78.00, 60, 20, inDays(300), 'Tablet', '10mg', 'Shelf C-2', 'Statin for lowering blood cholesterol and triglycerides'],
    ['Omeprazole 20mg (Omez)', 'Omeprazole', 'Gastrointestinal', 'OMZ-5520', 1, 35.00, 65.00, 5, 20, inDays(20), 'Capsule', '20mg', 'Shelf D-1', 'Critical: Low stock AND expiring soon item!'],
    ['Pantoprazole 40mg (Pan-40)', 'Pantoprazole Sodium', 'Gastrointestinal', 'PAN-6619', 3, 40.00, 75.00, 75, 20, inDays(15), 'Tablet', '40mg', 'Shelf D-2', 'Warning: Expiring in 15 days for alert testing'],
    ['Ibuprofen 400mg (Brufen)', 'Ibuprofen', 'Analgesic / NSAID', 'BRU-1284', 5, 18.00, 32.00, 110, 25, inDays(450), 'Tablet', '400mg', 'Shelf A-2', 'Anti-inflammatory and body pain reliever'],
    ['Montelukast + Levocetirizine (Montair-LC)', 'Montelukast + Levocetirizine', 'Respiratory', 'MLC-9011', 2, 85.00, 140.00, 50, 15, inDays(220), 'Tablet', '10mg+5mg', 'Shelf A-4', 'For allergic rhinitis and asthma symptoms'],
    ['Vitamin D3 60K (Calcirol)', 'Cholecalciferol', 'Vitamins / Minerals', 'D3-3321', 1, 45.00, 85.00, 4, 15, inDays(320), 'Sachet', '60,000 IU', 'Shelf E-1', 'Weekly bone health supplement (Low Stock)'],
    ['Cough Syrup (Ascoril-D)', 'Dextromethorphan + Chlorpheniramine', 'Cough & Cold', 'ASC-4411', 5, 55.00, 98.00, 35, 10, inDays(190), 'Syrup', '100ml', 'Shelf E-3', 'Sugar-free dry cough formula'],
    ['Oral Rehydration Salts (Electral)', 'ORS WHO formula', 'Electrolytes', 'ORS-2201', 5, 12.00, 22.00, 150, 30, inDays(600), 'Powder', '21.8g', 'Shelf F-1', 'Electrolyte replenish sachet'],
    ['Insulin Glargine (Lantus)', 'Insulin Glargine', 'Antidiabetic / Injectable', 'LAN-8812', 4, 450.00, 680.00, 12, 10, inDays(90), 'Injection', '100 IU/ml', 'Fridge-1', 'Long-acting basal insulin pen'],
    ['Betadine 10% Ointment', 'Povidone Iodine', 'Antiseptic', 'BET-1144', 3, 38.00, 64.00, 40, 10, inDays(400), 'Ointment', '20g', 'Shelf F-2', 'Topical wound antiseptic microbicidal']
  ];

  for (const m of medicinesData) {
    insertMedicine.run(...m);
  }

  // 5. Sample Past Sales (spanning recent days)
  const insertSale = db.prepare(`
    INSERT INTO sales (invoice_number, customer_id, customer_name, customer_phone, pharmacist_id, subtotal, discount_percentage, tax_percentage, total_amount, payment_method, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSaleItem = db.prepare(`
    INSERT INTO sale_items (sale_id, medicine_id, medicine_name, batch_number, quantity, unit_price, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleSales = [
    {
      inv: 'INV-2026-001',
      custId: 1,
      custName: 'Rahul Verma',
      custPhone: '+91 98111 22334',
      date: new Date(Date.now() - 3 * 86400000).toISOString(),
      items: [
        { id: 1, name: 'Paracetamol 650 (Dolo)', batch: 'DOL-8821', qty: 2, price: 30.00 },
        { id: 4, name: 'Cetirizine 10mg (Cetzine)', batch: 'CET-9942', qty: 1, price: 25.00 }
      ],
      discount: 5,
      tax: 5,
      pay: 'UPI'
    },
    {
      inv: 'INV-2026-002',
      custId: 2,
      custName: 'Sneha Roy',
      custPhone: '+91 97222 33445',
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      items: [
        { id: 2, name: 'Amoxicillin & Clavulanate (Augmentin)', batch: 'AUG-4491', qty: 1, price: 145.00 },
        { id: 12, name: 'Cough Syrup (Ascoril-D)', batch: 'ASC-4411', qty: 1, price: 98.00 }
      ],
      discount: 0,
      tax: 5,
      pay: 'Card'
    },
    {
      inv: 'INV-2026-003',
      custId: 3,
      custName: 'Amitabh Sen',
      custPhone: '+91 96333 44556',
      date: new Date(Date.now() - 1 * 86400000).toISOString(),
      items: [
        { id: 5, name: 'Metformin 500mg (Glycomet)', batch: 'GLY-7731', qty: 3, price: 42.00 },
        { id: 6, name: 'Atorvastatin 10mg (Atorva)', batch: 'ATO-3312', qty: 2, price: 78.00 }
      ],
      discount: 10,
      tax: 5,
      pay: 'Cash'
    },
    {
      inv: 'INV-2026-004',
      custId: 4,
      custName: 'Pooja Nair',
      custPhone: '+91 95444 55667',
      date: new Date().toISOString(),
      items: [
        { id: 11, name: 'Vitamin D3 60K (Calcirol)', batch: 'D3-3321', qty: 4, price: 85.00 },
        { id: 13, name: 'Oral Rehydration Salts (Electral)', batch: 'ORS-2201', qty: 5, price: 22.00 }
      ],
      discount: 5,
      tax: 5,
      pay: 'UPI'
    }
  ];

  for (const s of sampleSales) {
    const subtotal = s.items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const discounted = subtotal * (1 - s.discount / 100);
    const total = discounted * (1 + s.tax / 100);

    const res = insertSale.run(
      s.inv,
      s.custId,
      s.custName,
      s.custPhone,
      1, // Pharmacist / Admin ID
      subtotal,
      s.discount,
      s.tax,
      parseFloat(total.toFixed(2)),
      s.pay,
      'Routine prescription dispense',
      s.date
    );

    const saleId = Number(res.lastInsertRowid);
    for (const item of s.items) {
      insertSaleItem.run(
        saleId,
        item.id,
        item.name,
        item.batch,
        item.qty,
        item.price,
        item.qty * item.price
      );
    }
  }

  console.log('Seeding completed successfully!');
}

seed().catch(console.error);

