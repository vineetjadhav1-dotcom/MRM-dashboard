# Planedge Executive Dashboard (MRM Dashboard)
## Enterprise Project Documentation & Architectural Specification

---

## 1. Executive Summary & Business Purpose

The **Planedge Executive Dashboard** (also known as the **Monthly Review Meeting (MRM) Dashboard**) is an enterprise-grade web application engineered for executive project governance, multi-portfolio construction monitoring, milestone constraint diagnostics, and performance benchmarking across large-scale real estate and infrastructure developments.

### Key Business Objectives:
- **Centralized Operational Visibility**: Aggregates disparate data streams across hundreds of ongoing construction projects into unified, real-time executive dashboards.
- **Monthly Review Meeting (MRM) Automation**: Eliminates manual reporting efforts by automatically compiling standardized presentation slide decks and high-resolution A4 landscape PDF export reports.
- **10-Parameter Milestone Constraint Diagnostics**: Pinpoints precise operational blockers (drawings, contractor mobilization, material deliveries, labour shortages, client decisions, government NOCs, CRM handovers) before they cause project slippage.
- **Executive Performance Benchmarking**: Computes composite efficiency scores, Labour Productivity ($\text{₹}/\text{Lab.}/\text{Day}$), Construction Speed ($\text{₹}/\text{Sqft}/\text{Month}$), and Schedule Performance Index (SPI) across Executive VPs, General Managers, Project Leaders, and individual sites.
- **Granular Cross-Device Access Control**: Enables administrators to define exact tab and data scope visibility per user (e.g. restricting standard users to specific projects or leader views), synced seamlessly across laptops, desktops, and mobile devices via Cloud Firestore.

---

## 2. Technical Architecture & Tech Stack

```
                                  ┌──────────────────────────────┐
                                  │      Google Spreadsheets     │
                                  │ (Software 1, 2, 3 CSV Feeds) │
                                  └──────────────┬───────────────┘
                                                 │ Live Fetch / Sync
                                                 ▼
┌─────────────────────────┐       ┌──────────────────────────────┐
│  Cloud Firestore (DB)   │◄─────►│   Parsing & Ingestion Engine │
│ (RBAC, Settings & Auth) │       │   (sheetParser.ts, CSV API)  │
└─────────────────────────┘       └──────────────┬───────────────┘
                                                 │ Reactive Context
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │   Filter & Security Context  │
                                  │ (FilterContext & Auth State) │
                                  └──────────────┬───────────────┘
                                                 │
            ┌────────────────────────────────────┼────────────────────────────────────┐
            ▼                                    ▼                                    ▼
┌────────────────────────┐           ┌────────────────────────┐           ┌────────────────────────┐
│  Project Performance   │           │      MRM Dashboard     │           │   Milestone Analysis   │
│  & S-Curve Analytics   │           │   (LeaderSlide Decks)  │           │  & Site Diagnostics    │
└────────────────────────┘           └────────────────────────┘           └────────────────────────┘
            │                                    │                                    │
            └────────────────────────────────────┼────────────────────────────────────┘
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │   PDF & Report Generator     │
                                  │  (jsPDF, html2canvas, CSS)   │
                                  └──────────────────────────────┘
```

### Technology Matrix:
| Category | Technology | Purpose & Implementation |
| :--- | :--- | :--- |
| **Core Framework** | React 19 + TypeScript (~5.8) | Type-safe UI components, reactive state management, and high-performance DOM rendering. |
| **Build Tool & Bundler** | Vite 6 | Instant Hot Module Replacement (HMR) and optimized tree-shaken production bundles. |
| **Styling & Design System** | TailwindCSS v4 | Utility-first styling with custom light-slate enterprise tokens, responsive flex/grid layouts, and sleek micro-animations. |
| **Database & Realtime Sync** | Firebase Cloud Firestore v12 | Multi-device user authentication, persistent permission synchronization, and dynamic role enforcement. |
| **Data Visualization** | Recharts v3.9 | Interactive area charts, multi-metric bar charts, cumulative S-curves, and progress gauges. |
| **Iconography** | Lucide React | Modern, consistent vector iconography. |
| **Export & Reporting** | jsPDF, html2canvas, html2pdf.js | Multi-page A4 landscape executive presentation deck compilation and direct CSV downloads. |

---

## 3. Core System Windows & Navigation Modules

The dashboard is structured into 8 primary functional windows, accessible via the top horizontal navigation bar and dropdown menu drawer:

### 1. Project Performance Dashboard (`projectDashboard`)
- **Consolidated 5 Core Metrics**: Instant executive cards for **VOWD** ($\text{₹}\text{ Cr.}$), **Milestones** ($\text{Nos.}$), **Labour** ($\text{Headcount}$), **Residential Unit Delivery** ($\text{Units}$), and **Commercial Unit Delivery** ($\text{Sqft}$).
- **Plan Phase Switcher**: Toggle seamlessly between **R0 Baseline** and **R1 Revised** plans with live variance recalculations.
- **S-Curve & Monthly Trend Analytics**: Dual-axis visualizations comparing Planned vs Achieved trajectories across the selected Fiscal Year horizon.
- **Detailed Metric Breakdown Table**: Month-by-month tabular breakdown with percentage achievement badges and slippage flags.

### 2. Monthly Review Meeting (MRM) Dashboard (`leader`)
- **Leader & Portfolio Aggregates**: Groups projects by General Managers / Project Leaders under their respective Executive VPs.
- **Dynamic 8-Stage Lifecycle Grouping**: Projects automatically categorised into **Upcoming**, **Design**, **Excavation**, **Construction Start**, **Ongoing**, **Finishing**, **Handover**, and **On Hold** stages with interactive tooltips listing project names.
- **A4 Landscape Executive Slide Deck**: Renders executive presentation slides formatted to match enterprise board review decks.
- **Export PDF Report**: Single-click generation of the full multi-page executive presentation report.

### 3. Executive Performance Leaderboard (`leaderboard`)
- **Multi-Tier Rankings**: Compare performance across **Executive VPs**, **Project Leaders**, or **Individual Projects**.
- **Composite Efficiency Score & Grading**: Dynamically calculates scores and assigns letter grades ($A+, A, B, C$) based on weighted execution KPIs.
- **Specialized Construction Metrics**:
  - **Labour Productivity**: $\text{₹} / \text{Lab.} / \text{Day}$
  - **Labour Efficiency**: $\text{Cr. per 100 labours deployed}$
  - **Speed of Construction**: $\text{₹} / \text{Sqft} / \text{Month}$
  - **Schedule Performance Index (SPI)**: Portfolio-wide schedule health indicator.

### 4. Key Insights & Delivery Forecast (`insights`)
- **Horizon Split**: Divides time into **Completed Horizon** (April to latest closed month) and **Forecast Horizon** (upcoming months through March 2027).
- **Gap & Slippage Analysis**: Highlights deliverables lagging behind baseline targets and forecasts required monthly run-rates to recover schedules.
- **Interactive Parameter Selectors**: 1-click drill-downs into VOWD, Milestones, Labour, Residential Units, or Commercial Deliveries.

### 5. Milestone Analysis & Backlog Diagnostics (`milestones`)
- **Chronological Backlog Aging**: Sequence from oldest historical backlog (e.g. Apr 26) to the active cycle (Aug 26), enabling 1-click filtering by backlog age.
- **10-Parameter Site Constraint Diagnostics**: Tracks operational blockers across:
  1. *Contractor Appointment*
  2. *Drawing / GFC Release*
  3. *Work Front Availability*
  4. *Contractor Mobilization*
  5. *Material Delivery*
  6. *Labour Availability*
  7. *Client Decision*
  8. *Government Approval / NOC*
  9. *CRM Handover Clearance*
  10. *Other Constraints*
- **Action Recommendations & Remarks**: Preserves on-ground engineer notes and highlights critical path items.
- **CSV Data Export**: Direct export of filtered milestones for offline analysis.

### 6. Executive VP Portfolios (`vp`)
- Aggregated health scorecards and direct report portfolio distributions grouped by executive leadership.

### 7. Project Registry Matrix (`all`)
- Comprehensive searchable matrix of all registered construction projects with multi-criteria filtering by VP, Leader, Area, and Status.

### 8. User Management & Access Control (`userAccess` - Admin Only)
- Secure management of user credentials, account creation, and CSV bulk import.
- Fine-grained permission assignments per user (Allowed Navigation Tabs, Source Sheet access, Fiscal Year selection, Sync permissions).
- Scoped data access restrictions (restricting specific users to designated VPs, Leaders, or Projects).

---

## 4. Key Mathematical Formulae & Business Metrics

The system standardizes operational metrics using the following definitions:

$$\text{Speed of Construction} = \left( \frac{\text{Achieved VOWD of Under-Construction Projects}}{\text{Area of Under-Construction Projects (Sqft)}} \right) \times 10^7 \quad (\text{₹}/\text{Sqft}/\text{Month})$$

$$\text{Labour Productivity} = \left( \frac{\text{Achieved VOWD}}{\text{Total Labour Headcount}} \right) \times 10^7 \quad (\text{₹}/\text{Lab.}/\text{Day})$$

$$\text{Labour Efficiency} = \frac{\text{Achieved VOWD}}{\text{Total Labour Headcount} / 100} \quad (\text{Cr. per 100 Labours})$$

$$\text{Schedule Performance Index (SPI)} = \frac{\text{Earned Value (Achieved Progress)}}{\text{Planned Value (Target Baseline)}}$$

$$\text{Milestone Completion Rate (\%)} = \left( \frac{\text{Done Milestones}}{\text{Total Planned Milestones}} \right) \times 100$$

---

## 5. Security & Role-Based Access Control (RBAC)

### User Roles:
1. **Admin**:
   - Unrestricted access to all 8 navigation tabs.
   - Access to **User Management** (`userAccess`) and **Data Mapping** (`overview`).
   - Authority to trigger Live Spreadsheet sync and edit permission scopes.
2. **Standard User (e.g. `planedge`)**:
   - Access restricted strictly to permitted navigation tabs (defaults to `['projectDashboard', 'leader']`).
   - Optional restriction to specific VP portfolios, project leaders, or sites.
   - Admin-only routes and actions are hidden and blocked at both the UI and router levels.

### Persistence Mechanism:
Permissions configured by administrators are written to Cloud Firestore at `system_settings/user_management`. All clients subscribe to real-time snapshot updates with automatic offline caching and fallback defaults, guaranteeing persistent cross-device access control.

---

## 6. Directory Structure

```
d:/MRM dashboard/
├── public/
│   ├── favicon.ico              # Official Planedge shortcut icon
│   └── planedge-logo.png        # Official Planedge corporate brandmark
├── src/
│   ├── assets/                  # Static graphic assets & images
│   ├── components/              # Modular UI & view components
│   │   ├── Header.tsx           # Slim executive top navigation header & tab bar
│   │   ├── HorizontalFilterBar.tsx # Dynamic 1-line cascade filter (Org/VP/Leader/Project)
│   │   ├── ProjectDashboard.tsx # Project Performance & S-Curve consolidated view
│   │   ├── LeaderList.tsx       # MRM Leader review slide decks & lifecycle stages
│   │   ├── Leaderboard.tsx      # Benchmarking, ranking & efficiency tables
│   │   ├── KeyInsights.tsx      # Multi-tier forecast horizon & gap analysis
│   │   ├── MilestoneAnalysisView.tsx # 10 constraint diagnostics & aging backlog
│   │   ├── VPList.tsx           # Executive VP portfolio scorecards
│   │   ├── ProjectListTable.tsx # Global project registry matrix
│   │   ├── UserManagementView.tsx # Admin user access & RBAC center
│   │   ├── ColumnMapper.tsx     # Centralized spreadsheet column mapping
│   │   ├── PlanedgeLogo.tsx     # Responsive brand logo component
│   │   └── report/
│   │       └── MRMReportSlides.tsx # A4 Landscape executive slide compiler
│   ├── context/
│   │   └── FilterContext.tsx    # Reactive state for active filters & metric selection
│   ├── lib/
│   │   └── firebase.ts          # Firebase app initialization & Firestore client
│   ├── utils/
│   │   ├── sheetParser.ts       # CSV & live spreadsheet ingestion engine
│   │   ├── userManagement.ts    # User CRUD, RBAC logic & Firestore sync
│   │   ├── customOrder.ts       # Executive sequence sorting rules (VPs, Leaders)
│   │   ├── fiscalYear.ts        # Multi-year fiscal calendar ranges (FY26 to FY31)
│   │   └── pdfExport.ts         # High-resolution PDF generation utilities
│   ├── App.tsx                  # Root application router & view coordinator
│   ├── index.css                # Enterprise design system styles & typography
│   ├── main.tsx                 # React DOM root entry point
│   └── types.ts                 # Full TypeScript interface declarations
├── package.json                 # Dependencies and build scripts
├── vite.config.ts               # Vite configuration & plugins
└── README.md                    # Quickstart guide
```

---

## 7. Local Development & Deployment Guide

### Prerequisites:
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Git**

### Installation:
```bash
# 1. Clone the repository
git clone https://github.com/vineetjadhav1-dotcom/MRM-dashboard.git

# 2. Navigate to project directory
cd MRM-dashboard

# 3. Install dependencies
npm install
```

### Running Locally:
```bash
# Start local development server
npm run dev
```
The application will launch at `http://localhost:3000`.

### Production Build & Validation:
```bash
# Type check and generate production bundle
npm run build

# Preview production build locally
npm run preview
```

### Static Hosting Deployment:
The generated `dist/` directory is fully static and ready for deployment to **Firebase Hosting**, **Vercel**, **Netlify**, or **AWS S3/CloudFront**.

---

## 8. Maintainers & Governance
- **Organization**: Planedge
- **Repository**: [https://github.com/vineetjadhav1-dotcom/MRM-dashboard](https://github.com/vineetjadhav1-dotcom/MRM-dashboard)
- **Primary Branch**: `main`
