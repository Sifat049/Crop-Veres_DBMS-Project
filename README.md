











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
📸 Screenshots

Farmer Dashboard

Create Crop Listing

My Listings Management

Chat Interface

Price Trend Chart

Disease Reporting Page

<img width="1677" height="1074" alt="Screenshot 2026-01-29 at 1 07 01 AM" src="https://github.com/user-attachments/assets/06c63513-3034-4bcd-b234-c53913471a55" />

⚙️ Installation & Setup
1️⃣ Clone the Repository

git clone https://github.com/Sifat049/cropverse.git
cd cropverse

2️⃣ Install Dependencies
npm install

3️⃣ Run the Project
npm start

Open in browser:

http://127.0.0.1:5500/client/farmer/dashboard.html

🎯 Future Improvements

AI-based crop demand forecasting

Mobile app version

Multi-language support

Weather-based crop alerts

🤝 Contributors

Mishkat – Frontend & System Design

Team Members – Backend & AI Models

📜 License

This project is for educational and research purposes.

⭐ If you like this project, don’t forget to star the repo!




