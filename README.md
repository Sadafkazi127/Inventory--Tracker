# ShopMaster – Inventory & Billing Management System

ShopMaster is a full-stack Inventory and Billing Management System designed for small businesses and retail stores.

It provides a centralized platform to manage products, inventory, customers, sales, billing, reports, and business settings through a modern web and mobile-friendly interface.

## 🚀 Live Application

### Web Application
https://sadafkazi-mobile.expo.app

### Backend API
https://inventory-tracker-1-x43z.onrender.com

## 📱 Android Application

An Android APK is generated using Expo EAS Build.

The application connects to the deployed backend API and can be installed on Android devices.

## ✨ Features

### Dashboard
- Today's sales
- Monthly sales
- Total revenue
- Inventory value
- Recent sales
- Quick business statistics

### Product Management
- Add products
- Edit products
- Delete products
- Product categories
- Purchase price
- Selling price
- Stock quantity
- Low-stock tracking

### Inventory Management
- Track current stock
- Monitor stock levels
- Inventory valuation
- Stock updates after sales

### Billing / POS
- Create customer bills
- Add multiple products to a sale
- Quantity management
- Discounts
- GST calculation
- Automatic total calculation
- Complete sales
- Automatic stock deduction

### Customer Management
- Add customers
- Edit customer information
- Delete customers
- View customer purchase history
- Track total customer spending

### Sales History
- View previous sales
- Search and filter sales
- View individual invoices
- Generate invoice PDFs
- View complete sale details

### Reports
- Revenue reports
- Sales statistics
- Discount reports
- Average order value
- Product revenue analysis

### Settings
- Business information
- Currency settings
- GST settings
- Application preferences

## 🛠️ Technology Stack

### Frontend
- HTML
- Tailwind CSS
- React Native
- Expo
- Expo Router
- TypeScript
- React
- React Native Web

### Backend
- Node.js
- Express.js
- TypeScript
- REST API

### Database
- MySQL
- Drizzle ORM

### Authentication
- JWT
- Secure token storage

### Deployment
- Expo EAS Hosting – Web Application
- Expo EAS Build – Android APK
- Render – Backend API
- MySQL – Database

## 📂 Project Structure

```text
Inventory-Tracker/
│
├── artifacts/
│   ├── api-server/
│   │   └── src/
│   │       ├── controllers/
│   │       ├── routes/
│   │       ├── services/
│   │       └── schemas/
│   │
│   └── mobile/
│       ├── app/
│       │   ├── (tabs)/
│       │   ├── inventory/
│       │   ├── reports/
│       │   ├── sales/
│       │   └── settings/
│       │
│       ├── components/
│       ├── constants/
│       ├── context/
│       └── lib/
│
├── lib/
│   └── db/
│       └── src/
│           └── schema/
│
├── scripts/
├── package.json
├── pnpm-workspace.yaml
└── README.md

🌐 Web Deployment
Deployment Link: https://sadafkazi-mobile--7xoerqzv4t.expo.app
 
 🤖 Android APK

Download and install the latest Android APK:

👉 [Download Android APK](https://expo.dev/accounts/sadafkazi/projects/mobile/builds/44d978f3-ec7f-432c-ad16-f104ab01cf51)

### Production API

The Android application connects to the production backend:

Backend URL
https://inventory-tracker-1-x43z.onrender.com/api/healthz
