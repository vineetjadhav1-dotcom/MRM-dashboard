# Planedge Executive Dashboard (MRM Dashboard)

An enterprise-grade executive governance and multi-project construction monitoring dashboard for Planedge.

---

## 📖 Comprehensive Documentation
For full architectural specifications, data ingestion pipelines, mathematical definitions, RBAC security configurations, and module descriptions, please refer to:
👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18+
- **npm**: v9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
```

---

## 🌟 Key Features
- **Project Performance Dashboard**: Consolidated 5 Core Metrics (VOWD, Milestones, Labour, Residential UR, Commercial UC), R0/R1 Plan toggling, and cumulative S-Curves.
- **Monthly Review Meeting (MRM) Slide Decks**: Automatic 8-stage lifecycle grouping and 1-click A4 Landscape PDF presentation export.
- **Executive Performance Leaderboard**: VP, Leader, and Project benchmarking with Labour Productivity, Speed of Construction, and Composite Scoring.
- **Milestone Analysis & 10 Site Constraints**: Chronological backlog aging (Apr 26 $\to$ Aug 26) and 10-parameter roadblock diagnostics.
- **Key Insights & Delivery Forecast**: Horizon split (Completed vs Forecast till March 2027) with run-rate gap analysis.
- **Persistent Access Control (RBAC)**: Real-time Cloud Firestore synchronization with restricted navigation scopes per user.
