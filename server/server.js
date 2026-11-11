require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Connect to MongoDB (Atlas in production or local MongoDB)
const { connectDB } = require('./db/mongo');
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const { router: authRouter } = require('./routes/auth');
const medicinesRouter = require('./routes/medicines');
const suppliersRouter = require('./routes/suppliers');
const customersRouter = require('./routes/customers');
const salesRouter = require('./routes/sales');
const dashboardRouter = require('./routes/dashboard');

app.use('/api/auth', authRouter);
app.use('/api/medicines', medicinesRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/sales', salesRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: 'MongoDB',
    project: 'Pharmacy Management System',
    developer: 'Satyam Kumar (Reg: 12314877)',
    course: 'Full-Stack Web Development',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build from client/dist if present
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Pharmacy Management System running on http://localhost:${PORT}`);
  console.log(` Database: MongoDB (Atlas / Local)`);
  console.log(` Student: Satyam Kumar (Reg: 12314877)`);
  console.log(` Course: Full-Stack Web Development`);
  console.log(`====================================================`);
});
