# 🌾 CropVerse  
## Smart Climate-Aware Farmer Support & Marketplace System

CropVerse is a **DBMS-centric web application** designed to improve transparency, efficiency, and data-driven decision-making in the agricultural sector of Bangladesh.  
The platform connects **Farmers**, **Buyers**, and **Administrators** through a centralized marketplace powered by **MySQL database intelligence**.

> 📘 Developed as part of **CSE 3522 – Database Management Systems Lab**

---

## 📖 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [DBMS Concepts Used](#-dbms-concepts-used)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#️-installation--setup)
- [User Roles & Access](#-user-roles--access)
- [Screenshots](#-screenshots)
- [Future Enhancements](#-future-enhancements)
- [Testing](#-testing)
- [Course Information](#-course-information)
- [Author](#-author)

---

## 🌱 Overview

CropVerse provides a **digital agricultural ecosystem** where farmers can sell crops directly to buyers without middlemen, buyers can analyze price trends, and administrators can ensure platform integrity through approvals and monitoring.

The system heavily relies on **relational database design**, **normalization**, **triggers**, and **aggregation queries** to automate insights and maintain data integrity.

---

## ✨ Key Features

### 👨‍🌾 Farmer
- Create and manage crop listings
- Dashboard analytics:
  - Total products
  - Active listings
  - Total quantity sold
  - Total earnings
- Report crop diseases
- View alerts generated from disease severity
- Analyze crop price trends

### 🛒 Buyer
- Browse available crops
- Search by:
  - Crop name
  - Farmer name
  - District
- Purchase crops
- View total purchase amount
- Analyze historical price trends

### 🛡️ Admin
- Approve farmer & buyer signups
- Remove users
- View all users
- Monitor pending signup requests

---

## 🧠 DBMS Concepts Used

- Relational Database Design
- BCNF & 3NF Normalization
- Primary & Foreign Keys
- Triggers (price trend update, alert generation)
- Aggregation queries (SUM, COUNT, AVG)
- Role-based access control
- Transaction management

---

## 🛠️ Technology Stack

### Frontend
- HTML5  
- CSS3 (Responsive + Dark Mode)  
- Vanilla JavaScript  

### Backend
- Node.js  
- Express.js  
- JWT Authentication  
- bcrypt password hashing  

### Database
- MySQL  
- Triggers & analytical queries  

### Tools
- VS Code  
- MySQL Workbench  
- GitHub  

---

## 🗂️ Project Structure
cropverse/
├── client/
│ ├── index.html
│ ├── login.html
│ ├── signup.html
│ ├── farmer/
│ ├── buyer/
│ ├── admin/
│ ├── css/
│ └── js/
│
├── server/
│ ├── app.js
│ ├── db.js
│ ├── schema.sql
│ ├── mailer.js
│ ├── uploads/
│ └── package.json
│
└── README.md


---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/your-username/cropverse.git
cd cropverse

2️⃣ Install Server Dependencies
cd server
npm install

3️⃣ Database Setup

Open MySQL Workbench

Run:

CREATE DATABASE cropverse;
USE cropverse;


Execute schema.sql

4️⃣ Environment Configuration

Create .env inside server/

PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=cropverse
JWT_SECRET=your_secret
ADMIN_EMAIL=admin@example.com

5️⃣ Start Server
npm start


Server runs at:

http://localhost:4000

🔐 User Roles & Access
Role	Admin Approval Required
Admin	❌
Farmer	✅
Buyer	✅
📸 Screenshots

Screenshots will be added here

Login Page

Farmer Dashboard

Buyer Marketplace

Admin Dashboard

Price Trend Charts


<img width="1677" height="1074" alt="Screenshot 2026-01-29 at 1 07 01 AM" src="https://github.com/user-attachments/assets/06c63513-3034-4bcd-b234-c53913471a55" />

