# 💊 PharmaCare Pro - Pharmacy Management System

> **Full-Stack Web Development Project Assignment**  
> **Student Name:** Satyam Kumar  
> **Registration / Roll No:** 12314877  
> **Academic Course:** Full-Stack Web Development  

---

## 📋 Project Overview

**PharmaCare Pro** is an enterprise-grade, responsive Full-Stack Pharmacy Management System designed to streamline pharmacy operations, automate prescription billing, track pharmaceutical inventory with real-time stock alerts, manage suppliers, maintain customer allergy safety profiles, and generate compliant invoices and financial reports.

---

## ✨ Key Features

### 1. 📊 Executive Dashboard & Analytics
- **Live Financial KPIs**: Real-time total revenue, daily gross revenue, and transaction volume counters.
- **Stock & Inventory Health**: Total distinct medicines and total in-stock units.
- **Urgent Notification System**:
  - ⚠️ **Low Stock Alert**: Automatically highlights medicines that have fallen below safe reorder thresholds.
  - ⏰ **Expiring Soon Alert**: Identifies pharmaceuticals expiring within 30 days to avoid wastage.
- **Weekly Revenue Trend**: Interactive interactive area chart showing 7-day revenue performance.
- **Category Stock Breakdown**: Real-time therapeutic classification progress bars (Antibiotics, Analgesics, Antidiabetic, Cardiovascular, etc.).
- **Recent Transaction Stream**: Quick view of latest dispense receipts with 1-click modal preview.

### 2. 🛒 Point-of-Sale (POS) & Automated Billing
- **Real-Time Medicine Search**: Instant filtering by brand name, chemical/generic formula, or batch barcode.
- **Live Stock Guard**: Prevents dispensing more units than currently physically available in stock.
- **Dynamic Cart System**: Increment/decrement quantity steppers, itemized subtotals, and quick item removal.
- **Customer & Patient Association**: Supports both Walk-in clients and registered customer phone lookups.
- **Flexible Tax & Discount Engine**: Custom discount percentage and GST/tax calculation.
- **Multi-Payment Modes**: One-click toggling between **UPI / QR**, **Cash**, and **Card**.
- **Instant Printable Invoices**: Generates professional thermal/A4 medical bills with drugstore registration details, batch numbers, tax breakdown, and print-ready layout (`window.print()`).

### 3. 📦 Medicine & Inventory Management
- **Comprehensive Drug Records**: Brand Name, Generic/Chemical Formula, Category, Dosage Form (Tablet, Syrup, Capsule, Injection, Ointment), Strength (e.g., 650mg, 100ml), and Shelf Location (e.g., Shelf A-1, Fridge-1).
- **Batch Tracking**: Unique batch number identification for safety audits.
- **Quick Filters**: Instant toggle between *All Medicines*, *Low Stock Items*, and *Expiring Soon (&le;30 Days)*.
- **Full CRUD Capabilities**: Add new drugs, edit pricing and stock counts, or remove discontinued items.

### 4. 👥 Customer & Prescription Records
- **Patient Profiles**: Full name, contact number, email, and address.
- **Allergy & Safety Alerts**: Highlights known drug contraindications (e.g., *Penicillin allergic*, *Sulfa drugs*) in warning badges to prevent medication errors.
- **Lifetime Purchase History**: Tracks individual customer order frequency and cumulative spend.

### 5. 🚚 Supplier & Procurement Directory
- **Pharmaceutical Distributors**: Records major suppliers (Sun Pharma, Cipla, Dr. Reddy's, Abbott, Mankind).
- **Contact Registry**: Direct sales representative names, phone numbers, and warehouse addresses.
- **Supply Count**: Automatically shows how many drugs in inventory originate from each supplier.

### 6. 📈 Financial & Inventory Reports
- **Stock Valuation**: Calculates Total Capital Invested (Purchase Cost) vs. Total Projected Retail Value.
- **Gross Profit Margin Spread**: Live percentage margin estimator.
- **Category Distribution Chart**: Visual bar chart of stock quantities across categories.
- **1-Click CSV Export**: Downloads complete inventory database directly to `.csv` for Excel/Google Sheets.

### 7. 🔐 Role-Based Authentication
- **Secure JWT Authentication**: JSON Web Tokens with encrypted password hashing (`bcryptjs`).
- **1-Click Demo Buttons**: Easy switching between **Admin** (`satyam@pharmacy.com`) and **Pharmacist** (`pharmacist@pharmacy.com`) for seamless Viva demonstrations.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React Icons, Recharts, Canvas Confetti |
| **Backend API** | Node.js (v22), Express.js, RESTful Architecture, CORS, Multer |
| **Database** | Embedded SQLite (Zero-config, self-contained, no external database server required) |
| **Authentication** | JWT (JSON Web Tokens), `bcryptjs` password hashing |
| **Styling & UI** | Tailwind CSS with custom medical theme (Teal / Emerald palette), Print Media Styles |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher installed on your machine)
- **npm** (comes with Node.js)

### Running the Application

1. **Start the Unified Server** (Serves both the REST API and the Frontend on Port 5000):
   ```bash
   npm run server
   ```

2. **Open in Your Browser**:
   Open [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo Login Credentials

For testing and viva evaluation, you can either click the **1-Click Demo** buttons on the login screen, or type:

| Role | Email | Password |
|---|---|---|
| **Admin (Satyam Kumar)** | `satyam@pharmacy.com` | `admin123` |
| **Pharmacist (Staff)** | `pharmacist@pharmacy.com` | `pharma123` |

---

## 📁 Project Structure

```
Algions/
├── package.json               # Root scripts (server, client, build, seed)
├── README.md                  # Project documentation & viva guide
├── server/                    # Node.js + Express Backend
│   ├── package.json           # Backend dependencies
│   ├── server.js              # Express app, routes, static server
│   ├── db/
│   │   ├── database.js        # SQLite connection & database schema
│   │   └── seed.js            # Sample data (medicines, suppliers, sales, customers)
│   └── routes/
│       ├── auth.js            # Authentication (login, register, JWT)
│       ├── medicines.js       # Medicine CRUD, search, stock alerts
│       ├── suppliers.js       # Supplier management
│       ├── customers.js       # Customer directory & allergies
│       ├── sales.js           # POS checkout & invoice generation
│       └── dashboard.js       # KPI metrics & analytics charts
└── client/                    # Vite + React Frontend
    ├── package.json           # Frontend dependencies
    ├── vite.config.js         # Vite configuration with API proxy
    ├── tailwind.config.js     # Tailwind design system configuration
    ├── index.html             # HTML entry point
    └── src/
        ├── App.jsx            # Main app shell & navigation router
        ├── main.jsx           # React DOM root
        ├── index.css          # Tailwind base & print media styles
        ├── context/
        │   └── AuthContext.jsx # Global JWT session provider
        ├── utils/
        │   └── api.js         # API client & currency/date formatters
        ├── components/
        │   ├── Navbar.jsx      # Top bar with student badge & alerts bell
        │   ├── Sidebar.jsx     # Navigation tabs & academic info card
        │   └── InvoiceModal.jsx # Thermal/A4 medical invoice printer
        └── pages/
            ├── Login.jsx       # Login screen with 1-click demo logins
            ├── Dashboard.jsx   # Analytics cards, charts & warnings
            ├── POSBilling.jsx  # Cashier register, cart & checkout
            ├── Inventory.jsx   # Medicine table with modal CRUD
            ├── SalesHistory.jsx# Transaction records & invoice reprint
            ├── Customers.jsx   # Patient directory & allergy flags
            ├── Suppliers.jsx   # Supplier registry & contact info
            └── Reports.jsx     # Financial valuation & CSV export
```

---

## 🎓 Academic Submission Details

- **Student Name:** Satyam Kumar
- **Registration Number:** 12314877
- **Course Title:** Full-Stack Web Development
- **Project Topic:** Pharmacy Management System
- **Year:** 2026
