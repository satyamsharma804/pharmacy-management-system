const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pharmacy_db';

async function connectDB() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI.replace(/:\/\/.*@/, '://<credentials>@')}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully!');
    await seedIfEmpty();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.warn('Please provide a valid MONGODB_URI in .env or ensure MongoDB is running.');
  }
}

async function seedIfEmpty() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('MongoDB already populated. Skipping initial seed.');
      return;
    }

    console.log('Seeding initial MongoDB pharmacy data...');

    const salt = bcrypt.genSaltSync(10);
    const adminPass = bcrypt.hashSync('admin123', salt);
    const pharmaPass = bcrypt.hashSync('pharma123', salt);

    // 1. Users
    const admin = await User.create({
      name: 'Satyam Kumar',
      email: 'satyam@pharmacy.com',
      password: adminPass,
      role: 'admin',
      phone: '+91 98765 43210'
    });

    await User.create({
      name: 'Priya Sharma',
      email: 'pharmacist@pharmacy.com',
      password: pharmaPass,
      role: 'pharmacist',
      phone: '+91 99887 76655'
    });

    // 2. Suppliers
    const suppliers = await Supplier.insertMany([
      { name: 'Sun Pharma Distributors', contact_person: 'Rajesh Gupta', email: 'orders@sunpharma.example.com', phone: '+91 11 2345 6789', address: 'Plot 45, Okhla Industrial Area, New Delhi' },
      { name: 'Cipla Healthcare Logistics', contact_person: 'Anita Desai', email: 'supply@cipla.example.com', phone: '+91 22 4567 8901', address: 'Bandra Kurla Complex, Mumbai' },
      { name: "Dr. Reddy's Laboratories", contact_person: 'Vikram Patel', email: 'reddy.orders@drreddys.example.com', phone: '+91 40 3456 7890', address: 'Ameerpet, Hyderabad' },
      { name: 'Abbott India Direct', contact_person: 'Kavita Singh', email: 'inquiry@abbott.example.com', phone: '+91 80 5678 1234', address: 'Whitefield Tech Zone, Bangalore' },
      { name: 'Mankind Pharma Hub', contact_person: 'Deepak Verma', email: 'dist@mankind.example.com', phone: '+91 120 4455 667', address: 'Sector 62, Noida' }
    ]);

    // 3. Customers
    const customers = await Customer.insertMany([
      { name: 'Rahul Verma', phone: '+91 98111 22334', email: 'rahul.v@gmail.com', address: 'Flat 402, Green Glen Apartments, Delhi', allergies: 'Penicillin allergic' },
      { name: 'Sneha Roy', phone: '+91 97222 33445', email: 'sneha.roy@gmail.com', address: 'B-14 Rosewood Lane, Noida', allergies: 'None' },
      { name: 'Amitabh Sen', phone: '+91 96333 44556', email: 'amitabh.sen@yahoo.com', address: '55 Kailash Hills, New Delhi', allergies: 'Sulfa drugs' },
      { name: 'Pooja Nair', phone: '+91 95444 55667', email: 'pooja.nair@outlook.com', address: 'Sector 15, Gurgaon', allergies: 'None' },
      { name: 'Rohan Mehta', phone: '+91 94555 66778', email: 'rohan.m@gmail.com', address: 'C-3 Civil Lines, Delhi', allergies: 'Aspirin sensitive' }
    ]);

    // Helper dates
    const inDays = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    // 4. Medicines
    const medicinesData = [
      { name: 'Paracetamol 650 (Dolo)', generic_name: 'Acetaminophen', category: 'Analgesic / Antipyretic', batch_number: 'DOL-8821', supplier: suppliers[0]._id, supplier_name: suppliers[0].name, purchase_price: 15, selling_price: 30, quantity: 120, min_stock_level: 20, expiry_date: inDays(365), dosage_form: 'Tablet', strength: '650mg', location_shelf: 'Shelf A-1', description: 'Relief from mild pain and fever' },
      { name: 'Amoxicillin & Clavulanate (Augmentin)', generic_name: 'Amoxicillin + Clavulanic Acid', category: 'Antibiotic', batch_number: 'AUG-4491', supplier: suppliers[1]._id, supplier_name: suppliers[1].name, purchase_price: 95, selling_price: 145, quantity: 45, min_stock_level: 15, expiry_date: inDays(180), dosage_form: 'Tablet', strength: '625mg', location_shelf: 'Shelf B-2', description: 'Broad spectrum antibacterial prescription' },
      { name: 'Azithromycin 500 (Azee)', generic_name: 'Azithromycin', category: 'Antibiotic', batch_number: 'AZI-1029', supplier: suppliers[1]._id, supplier_name: suppliers[1].name, purchase_price: 70, selling_price: 115, quantity: 8, min_stock_level: 15, expiry_date: inDays(240), dosage_form: 'Tablet', strength: '500mg', location_shelf: 'Shelf B-3', description: 'Respiratory infection antibiotic (Low stock item)' },
      { name: 'Cetirizine 10mg (Cetzine)', generic_name: 'Cetirizine Hydrochloride', category: 'Antihistamine', batch_number: 'CET-9942', supplier: suppliers[2]._id, supplier_name: suppliers[2].name, purchase_price: 12, selling_price: 25, quantity: 80, min_stock_level: 20, expiry_date: inDays(400), dosage_form: 'Tablet', strength: '10mg', location_shelf: 'Shelf A-3', description: 'Allergy relief' },
      { name: 'Metformin 500mg (Glycomet)', generic_name: 'Metformin Hydrochloride', category: 'Antidiabetic', batch_number: 'GLY-7731', supplier: suppliers[3]._id, supplier_name: suppliers[3].name, purchase_price: 22, selling_price: 42, quantity: 95, min_stock_level: 25, expiry_date: inDays(500), dosage_form: 'Tablet', strength: '500mg', location_shelf: 'Shelf C-1', description: 'Oral antidiabetic medicine' },
      { name: 'Atorvastatin 10mg (Atorva)', generic_name: 'Atorvastatin Calcium', category: 'Cardiovascular', batch_number: 'ATO-3312', supplier: suppliers[3]._id, supplier_name: suppliers[3].name, purchase_price: 45, selling_price: 78, quantity: 60, min_stock_level: 20, expiry_date: inDays(300), dosage_form: 'Tablet', strength: '10mg', location_shelf: 'Shelf C-2', description: 'Statin for cholesterol lowering' },
      { name: 'Omeprazole 20mg (Omez)', generic_name: 'Omeprazole', category: 'Gastrointestinal', batch_number: 'OMZ-5520', supplier: suppliers[0]._id, supplier_name: suppliers[0].name, purchase_price: 35, selling_price: 65, quantity: 5, min_stock_level: 20, expiry_date: inDays(20), dosage_form: 'Capsule', strength: '20mg', location_shelf: 'Shelf D-1', description: 'Low stock AND expiring soon' },
      { name: 'Pantoprazole 40mg (Pan-40)', generic_name: 'Pantoprazole Sodium', category: 'Gastrointestinal', batch_number: 'PAN-6619', supplier: suppliers[2]._id, supplier_name: suppliers[2].name, purchase_price: 40, selling_price: 75, quantity: 75, min_stock_level: 20, expiry_date: inDays(15), dosage_form: 'Tablet', strength: '40mg', location_shelf: 'Shelf D-2', description: 'Expiring in 15 days warning item' },
      { name: 'Ibuprofen 400mg (Brufen)', generic_name: 'Ibuprofen', category: 'Analgesic / NSAID', batch_number: 'BRU-1284', supplier: suppliers[4]._id, supplier_name: suppliers[4].name, purchase_price: 18, selling_price: 32, quantity: 110, min_stock_level: 25, expiry_date: inDays(450), dosage_form: 'Tablet', strength: '400mg', location_shelf: 'Shelf A-2', description: 'Anti-inflammatory body pain relief' },
      { name: 'Montelukast + Levocetirizine (Montair-LC)', generic_name: 'Montelukast + Levocetirizine', category: 'Respiratory', batch_number: 'MLC-9011', supplier: suppliers[1]._id, supplier_name: suppliers[1].name, purchase_price: 85, selling_price: 140, quantity: 50, min_stock_level: 15, expiry_date: inDays(220), dosage_form: 'Tablet', strength: '10mg+5mg', location_shelf: 'Shelf A-4', description: 'For allergic rhinitis & asthma' },
      { name: 'Vitamin D3 60K (Calcirol)', generic_name: 'Cholecalciferol', category: 'Vitamins / Minerals', batch_number: 'D3-3321', supplier: suppliers[0]._id, supplier_name: suppliers[0].name, purchase_price: 45, selling_price: 85, quantity: 4, min_stock_level: 15, expiry_date: inDays(320), dosage_form: 'Sachet', strength: '60,000 IU', location_shelf: 'Shelf E-1', description: 'Bone health supplement (Low Stock)' },
      { name: 'Cough Syrup (Ascoril-D)', generic_name: 'Dextromethorphan + Chlorpheniramine', category: 'Cough & Cold', batch_number: 'ASC-4411', supplier: suppliers[4]._id, supplier_name: suppliers[4].name, purchase_price: 55, selling_price: 98, quantity: 35, min_stock_level: 10, expiry_date: inDays(190), dosage_form: 'Syrup', strength: '100ml', location_shelf: 'Shelf E-3', description: 'Sugar-free dry cough syrup' },
      { name: 'Oral Rehydration Salts (Electral)', generic_name: 'ORS WHO formula', category: 'Electrolytes', batch_number: 'ORS-2201', supplier: suppliers[4]._id, supplier_name: suppliers[4].name, purchase_price: 12, selling_price: 22, quantity: 150, min_stock_level: 30, expiry_date: inDays(600), dosage_form: 'Powder', strength: '21.8g', location_shelf: 'Shelf F-1', description: 'Hydration sachet' },
      { name: 'Insulin Glargine (Lantus)', generic_name: 'Insulin Glargine', category: 'Antidiabetic / Injectable', batch_number: 'LAN-8812', supplier: suppliers[3]._id, supplier_name: suppliers[3].name, purchase_price: 450, selling_price: 680, quantity: 12, min_stock_level: 10, expiry_date: inDays(90), dosage_form: 'Injection', strength: '100 IU/ml', location_shelf: 'Fridge-1', description: 'Basal insulin pen' },
      { name: 'Betadine 10% Ointment', generic_name: 'Povidone Iodine', category: 'Antiseptic', batch_number: 'BET-1144', supplier: suppliers[2]._id, supplier_name: suppliers[2].name, purchase_price: 38, selling_price: 64, quantity: 40, min_stock_level: 10, expiry_date: inDays(400), dosage_form: 'Ointment', strength: '20g', location_shelf: 'Shelf F-2', description: 'Topical antiseptic' }
    ];

    const insertedMeds = await Medicine.insertMany(medicinesData);

    // 5. Sample Past Sales
    await Sale.create([
      {
        invoice_number: 'INV-2026-001',
        customer: customers[0]._id,
        customer_name: customers[0].name,
        customer_phone: customers[0].phone,
        pharmacist: admin._id,
        pharmacist_name: admin.name,
        items: [
          { medicine_id: insertedMeds[0]._id.toString(), medicine_name: insertedMeds[0].name, batch_number: insertedMeds[0].batch_number, quantity: 2, unit_price: 30, total_price: 60, dosage_form: 'Tablet', strength: '650mg' },
          { medicine_id: insertedMeds[3]._id.toString(), medicine_name: insertedMeds[3].name, batch_number: insertedMeds[3].batch_number, quantity: 1, unit_price: 25, total_price: 25, dosage_form: 'Tablet', strength: '10mg' }
        ],
        subtotal: 85,
        discount_percentage: 5,
        tax_percentage: 5,
        total_amount: 84.79,
        payment_method: 'UPI',
        notes: 'Routine refill',
        createdAt: new Date(Date.now() - 3 * 86400000)
      },
      {
        invoice_number: 'INV-2026-002',
        customer: customers[1]._id,
        customer_name: customers[1].name,
        customer_phone: customers[1].phone,
        pharmacist: admin._id,
        pharmacist_name: admin.name,
        items: [
          { medicine_id: insertedMeds[1]._id.toString(), medicine_name: insertedMeds[1].name, batch_number: insertedMeds[1].batch_number, quantity: 1, unit_price: 145, total_price: 145, dosage_form: 'Tablet', strength: '625mg' },
          { medicine_id: insertedMeds[11]._id.toString(), medicine_name: insertedMeds[11].name, batch_number: insertedMeds[11].batch_number, quantity: 1, unit_price: 98, total_price: 98, dosage_form: 'Syrup', strength: '100ml' }
        ],
        subtotal: 243,
        discount_percentage: 0,
        tax_percentage: 5,
        total_amount: 255.15,
        payment_method: 'Card',
        notes: 'Antibiotic course',
        createdAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        invoice_number: 'INV-2026-003',
        customer: customers[2]._id,
        customer_name: customers[2].name,
        customer_phone: customers[2].phone,
        pharmacist: admin._id,
        pharmacist_name: admin.name,
        items: [
          { medicine_id: insertedMeds[4]._id.toString(), medicine_name: insertedMeds[4].name, batch_number: insertedMeds[4].batch_number, quantity: 3, unit_price: 42, total_price: 126, dosage_form: 'Tablet', strength: '500mg' },
          { medicine_id: insertedMeds[5]._id.toString(), medicine_name: insertedMeds[5].name, batch_number: insertedMeds[5].batch_number, quantity: 2, unit_price: 78, total_price: 156, dosage_form: 'Tablet', strength: '10mg' }
        ],
        subtotal: 282,
        discount_percentage: 10,
        tax_percentage: 5,
        total_amount: 266.49,
        payment_method: 'Cash',
        notes: 'Chronic care refill',
        createdAt: new Date(Date.now() - 1 * 86400000)
      },
      {
        invoice_number: 'INV-2026-004',
        customer: customers[3]._id,
        customer_name: customers[3].name,
        customer_phone: customers[3].phone,
        pharmacist: admin._id,
        pharmacist_name: admin.name,
        items: [
          { medicine_id: insertedMeds[10]._id.toString(), medicine_name: insertedMeds[10].name, batch_number: insertedMeds[10].batch_number, quantity: 4, unit_price: 85, total_price: 340, dosage_form: 'Sachet', strength: '60,000 IU' },
          { medicine_id: insertedMeds[12]._id.toString(), medicine_name: insertedMeds[12].name, batch_number: insertedMeds[12].batch_number, quantity: 5, unit_price: 22, total_price: 110, dosage_form: 'Powder', strength: '21.8g' }
        ],
        subtotal: 450,
        discount_percentage: 5,
        tax_percentage: 5,
        total_amount: 448.88,
        payment_method: 'UPI',
        notes: 'Seasonal wellness',
        createdAt: new Date()
      }
    ]);

    console.log('MongoDB seeding completed successfully!');
  } catch (err) {
    console.error('Error during MongoDB seeding:', err);
  }
}

module.exports = { connectDB };
