# 🛡️ Personal Mail Monitor (PMM)

### *Premium Email Intelligence & Infrastructure Monitoring Ecosystem*

MailMonitor is a high-fidelity, real-time dashboard designed for the modern SaaS professional. It seamlessly integrates secure Google Firebase authentication with a sophisticated glassmorphic interface to provide deep insights into your email communication, business analytics, and system architecture.


---



## 📸 App Showcase

### 🔐 Multi-Auth Login
![Login Page](/screenshots/login-page.png)

### 📊 Main Dashboard
![Main Dashboard](/screenshots/main-screen.png)

### 📨 Incoming Mails
![Incoming Mails](/screenshots/incoming-mails.png)

### 💳 Premium Checkout
![Payment Page](/screenshots/payment-page.png)

### 🎟️ Subscription Plans
![Plans](/screenshots/plans.png)

### ⚙️ System Settings
![Settings](/screenshots/settings.png)

### 🧠 Analytics & Visualization
![Visualization](/screenshots/visualization.png)



---


## ✨ Features

- **💎 Premium SaaS Aesthetic**: Custom-built dark-mode UI with glassmorphism, fluid Framer Motion animations, and ambient glowing backgrounds.
- **📊 Multi-Dimensional Dashboards**: 
    - **Personal**: Overview of metrics and spendings.
    - **Business Analytics**: Gated insight into orders, revenue, and customer trends.
    - **HR Tracker**: Dedicated node for monitoring application and interview pipelines.
    - **Alerts Center**: Real-time security and system monitoring alerts.
- **🛰️ Interactive Ecosystem Architecture**: Live visualization of data flow between connected nodes and cloud infrastructure.
- **💳 Integrated Checkout Node**: A secure, premium payment screen for subscription upgrades (Basic, Pro, Elite).
- **🗝️ Lucky Coupon System**: 15-character bypass protocol for instant access to Elite features.
- **🔒 Enterprise-Grade Security**: Firebase-powered Google Auth for Zero-Trust communication.

---

## 📐 Project Workflow & Architecture

The application operates on a **Bifurcated Node Architecture**:

1.  **Frontend (UI/UX Node)**: React + Vite application that handles state management via Zustand and renders high-performance visualizations.
2.  **Backend (Service Node)**: Node.js/Express server that manages user permissions and subscription state using a persistent SQLite3 database.
3.  **Authentication Gate**: A Firebase-guarded entry point (ConnectEmail) ensuring session persistence.
4.  **Verification Gate**: A dynamic middleware logic that validates plan permissions before allowing access to high-tier analytics.

---

## 🚀 Tech Stack

- **Frontend**: ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
- **Visuals**: ![Lucide](https://img.shields.io/badge/Lucide_Icons-FF4B4B?style=for-the-badge) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white) ![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge)
- **Backend & DB**: ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

---

## 🛠️ Installation Guide

Follow these simple steps to get MailMonitor running on your local machine.

### 1. Clone the Repository
```bash
git clone https://github.com/Hariharan-S5/mailmonitor.git
cd mailmonitor
```

### 2. Backend Setup
```bash
cd PMM-backend
npm install
```

### 3. Frontend Setup
Open a new terminal in the root directory:
```bash
npm install
```

---

## ⚙️ Setup Instructions

### Local Development
1. **Start Backend**: From `PMM-backend/`, run:
   ```bash
   node app.js
   ```
   *The service will start on `http://localhost:3000`.*
   
2. **Start Frontend**: From the root directory, run:
   ```bash
   npm run dev
   ```
   *The UI will be available at `http://localhost:5173/`.*

### Environment Configuration
Ensure you have a `.env` file in the `PMM-backend/` folder (standard variables are handled automatically by the server start). 
*For Firebase integration, replace the config in `src/firebase.js` if deploying your own instance.*

---

## 📖 Usage Instructions

1.  **Launch**: Visit `http://localhost:5173/`.
2.  **Connect**: Click **"Continue with Google"** to authenticate.
3.  **Upgrade**: Use the **Plans** page to select a "Sync Node". 
4.  **Bypass**: Enter a **Lucky Coupon** (e.g., `ELITE@2026#STAR`) to unlock Elite features instantly.
5.  **Explore**: Use the sidebar to switch between Business, HR, and Security analytics.

---

## 📂 Folder Structure

```bash
📦 MailMonitor
 ┣ 📂 PMM-backend         # Backend Service Node
 ┃ ┣ 📂 controllers      # API Logic & Subscriptions
 ┃ ┣ 📂 database         # SQLite Initializer & db.js
 ┃ ┣ 📂 models           # User Data Models
 ┃ ┗ 📜 app.js           # Server Entry Point
 ┣ 📂 src                 # Frontend UI Node
 ┃ ┣ 📂 components       # Shared UI (Header, Sidebar, Spinner)
 ┃ ┣ 📂 pages            # Screen Components (Architecture, Checkout, Dashboard)
 ┃ ┣ 📂 store            # Global State (useEmailStore.js)
 ┃ ┗ 📜 App.jsx          # Root Routing
 ┣ 📂 public              # Static Branding Assets (Favicon)
 ┣ 📜 index.html         # HTML Template
 ┗ 📜 README.md          # Documentation
```

---

## 🔮 Future Improvements

- [ ] **AI-Driven Predictive Scoring**: Auto-tag emails with a "Priority Score".
- [ ] **Native Mobile App**: Flutter/React Native wrapper for on-the-go monitoring.
- [ ] **Multilingual Support**: Internationalization for global enterprise teams.
- [ ] **Blockchain Ledger**: Immutable logging of security alerts for audit compliance.

---

## 🤝 Contribution Guide

1.  **Fork** the project.
2.  Create your **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** to the branch (`git checkout origin feature/AmazingFeature`).
5.  Open a **Pull Request**.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

*Designed for the elite, built for everyone.* 🛡️
