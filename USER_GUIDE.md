# Planedge Executive Dashboard (MRM Portal) — Comprehensive User Guide

---

## Table of Contents
1. [Introduction & System Overview](#1-introduction--system-overview)
2. [Architecture, Data Sources & Realtime Sync](#2-architecture-data-sources--realtime-sync)
3. [User Authentication & Role-Based Access Control (RBAC)](#3-user-authentication--role-based-access-control-rbac)
4. [Top Navigation Header & Global Controls](#4-top-navigation-header--global-controls)
5. [Universal 1-Line Dynamic Cascading Filter Bar](#5-universal-1-line-dynamic-cascading-filter-bar)
6. [Module-by-Module In-Depth Walkthrough](#6-module-by-module-in-depth-walkthrough)
   - [6.1 Project Performance Dashboard (`projectDashboard`)](#61-project-performance-dashboard)
   - [6.2 Monthly Review Meeting (MRM) Dashboard (`leader`)](#62-monthly-review-meeting-mrm-dashboard)
   - [6.3 Executive Performance Leaderboard (`leaderboard`)](#63-executive-performance-leaderboard)
   - [6.4 Milestone Analysis & Site Diagnostics (`milestones`)](#64-milestone-analysis--site-diagnostics)
   - [6.5 Key Insights & Multi-Horizon Delivery Forecast (`insights`)](#65-key-insights--multi-horizon-delivery-forecast)
   - [6.6 Executive VP Portfolios (`vp`)](#66-executive-vp-portfolios)
   - [6.7 Master Project Registry Matrix (`all`)](#67-master-project-registry-matrix)
   - [6.8 Data Configuration & Column Mapping (`overview`)](#68-data-configuration--column-mapping)
   - [6.9 User Management & Permission Scoping (`userAccess`)](#69-user-management--permission-scoping)
7. [Executive Presentation Slide Deck & PDF Export Engine](#7-executive-presentation-slide-deck--pdf-export-engine)
8. [Executive Metrics & Mathematical Formulations](#8-executive-metrics--mathematical-formulations)
9. [Troubleshooting & Frequently Asked Questions (FAQs)](#9-troubleshooting--frequently-asked-questions-faqs)

---

## 1. Introduction & System Overview

The **Planedge Executive Dashboard (Monthly Review Meeting / MRM Portal)** is an enterprise project management, executive analytics, and governance platform designed for high-level monitoring of large-scale construction, infrastructure, and real estate portfolios.

### Key Capabilities:
- **Centralized Project Governance**: Consolidates operational data across hundreds of active construction sites under multiple Executive VPs and General Managers.
- **Automated Monthly Review Meetings**: Eliminates hours of manual slide deck preparation by dynamically building board-ready A4 landscape review decks.
- **10-Parameter Site Constraint Diagnostics**: Real-time identification of operational bottlenecks (drawings, contractor mobilization, material deliveries, labour availability, client decisions, government NOCs, CRM handovers).
- **Executive Performance Benchmarking**: Computes composite efficiency ratings, Labour Productivity ($\text{₹}/\text{Lab.}/\text{Day}$), Construction Speed ($\text{₹}/\text{Sqft}/\text{Month}$), and Schedule Performance Index (SPI).
- **Multi-Device Cloud Synchronization**: Securely synchronizes user credentials, permissions, and scoped portfolio access across devices using Cloud Firestore.

---

## 2. Architecture, Data Sources & Realtime Sync

```
 ┌────────────────────────────────────────────────────────┐
 │            Google Spreadsheets / CSV Feeds             │
 │   • Software 1: Master Registry & Budgets              │
 │   • Software 2: Monthly Metric Trajectories (FY26-31)  │
 │   • Software 3: Milestone 10-Constraint Matrix         │
 └───────────────────────────┬────────────────────────────┘
                             │ Live Fetch via CSV API
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │              Parsing & Ingestion Engine                │
 │  (sheetParser.ts, customOrder.ts, fiscalYear.ts)       │
 └───────────────────────────┬────────────────────────────┘
                             │
     ┌───────────────────────┴───────────────────────┐
     ▼                                               ▼
┌───────────────────────────┐           ┌───────────────────────────┐
│   Cloud Firestore (DB)    │           │ Global FilterContext &    │
│  (Users, RBAC & Scopes)   │◄─────────►│ Permission Enforcement    │
└───────────────────────────┘           └─────────────┬─────────────┘
                                                      │
         ┌────────────────────────────────────────────┼────────────────────────────────────────────┐
         ▼                                            ▼                                            ▼
┌───────────────────────────┐            ┌───────────────────────────┐            ┌───────────────────────────┐
│ Project Dashboard &       │            │ MRM Leader Slide Deck     │            │ Milestone Analysis &      │
│ S-Curve Trajectories      │            │ & Lifecycle Groupings     │            │ Bottleneck Diagnostics    │
└───────────────────────────┘            └───────────────────────────┘            └───────────────────────────┘
```

### The Three Data Streams:
1. **Software 1 (Master Project Registry)**: Contains project codes, names, Executive VPs, Project Leaders, cities/areas, total budgets, areas (sqft), baseline finish dates, and overall status (Green, Amber, Red).
2. **Software 2 (Time-Phased Monthly Plan vs Actuals)**: Ingests month-by-month historical and forecasted figures for 5 core parameters (VOWD in ₹ Cr., Milestones in Nos., Labour in Headcount, Residential Unit Deliveries, Commercial Unit Deliveries) across multiple Fiscal Years (FY26–27 through FY30–31), along with monthly SPI and QHSE ratings.
3. **Software 3 (Milestone Constraint Diagnostics)**: Contains individual milestone deliverables, weekly planned schedules (W1–W4), critical path indicators, backlog aging months, and 10 operational constraint assessments.

---

## 3. User Authentication & Role-Based Access Control (RBAC)

The application provides a secure authentication screen with two privilege tiers:

### 1. Administrator (`admin`)
- **Full Access**: Unrestricted access to all 9 navigation tabs.
- **System Administration**: Authority to manage user accounts, reset passwords, define custom tab permissions, and assign portfolio scopes.
- **Data Configuration**: Authority to modify column mappings, adjust header row indices, and trigger live spreadsheet re-syncs.

### 2. Standard User (`user` - e.g. `planedge`)
- **Custom Tab Visibility**: Restricted strictly to the tabs granted by administrators (typically `projectDashboard`, `leader`, `leaderboard`, `milestones`, `insights`).
- **Scoped Data Access**: Administrators can restrict a standard user to view **only** their assigned Executive VP, Project Leader, or Whitelisted Project Codes.
- **Protected Actions**: Administrative tabs (`overview`, `userAccess`) and restricted features are automatically hidden and blocked.

---

## 4. Top Navigation Header & Global Controls

The top header bar provides persistent access to global controls:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Planedge Logo]  [FY26-27 ▾]  [Sync 🔄]  [Modules Menu ▾]                [User Profile] [Logout]  │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Brandmark & Title**: Displays the official Planedge brandmark and dynamic organization status.
2. **Fiscal Year Selector (`FY26-27` to `FY30-31`)**: Switches the active multi-year planning horizon across all charts, tables, and forecasts.
3. **Live Sync Button (`Synchronize Live Spreadsheet`)**: Fetches the latest live records from the master Google Sheets, recalculates all variances, and updates the local state.
4. **Navigation Menu Drawer**: A drop-down menu that provides one-click navigation across all 9 operational modules.
5. **Active User Badge & Logout**: Displays the current user's role and allows single-click session logout.

---

## 5. Universal 1-Line Dynamic Cascading Filter Bar

Located directly beneath the header across all views, the **Horizontal Cascading Filter Bar** allows instant slicing of project data:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Hierarchy: [Organization (All) ▾]  ➜  [Executive VP ▾]  ➜  [Project Leader ▾]  ➜  [Project Code ▾]  │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Cascading Rules:
- **Organization Level**: Aggregates all ongoing projects across the entire company.
- **Executive VP**: Selecting a VP filters the Leader and Project dropdowns to only those under that VP's portfolio.
- **Project Leader**: Selecting a Leader filters the Project dropdown to only projects assigned to that Leader.
- **Project Code / Name**: Slices all dashboard cards, charts, S-curves, and tables down to a single site.
- **Searchable Comboboxes**: Each dropdown includes an instant search box to quickly filter by typing names or codes.
- **Reset Button**: Single-click reset to return to the organization-wide view.

---

## 6. Module-by-Module In-Depth Walkthrough

### 6.1 Project Performance Dashboard (`projectDashboard`)
**Primary View for Detailed Project Execution & S-Curve Analysis**

#### Key Features:
1. **5 Consolidated Executive Metric Cards**:
   - **VOWD (Value of Work Done)**: Displayed in $\text{₹}\text{ Cr.}$, comparing Plan vs Achieved with variance and percentage completion.
   - **Milestones**: Planned vs Achieved milestone counts.
   - **Labour**: Average daily planned vs actual headcount deployed.
   - **Residential Units Delivery (UR)**: Number of residential units delivered.
   - **Commercial Delivery (UC)**: Square footage / units of commercial delivery.
2. **Plan Phase Switcher**:
   - **R0 Baseline Plan**: The original approved baseline.
   - **R1 Revised Plan**: The updated operational target for current execution.
3. **S-Curve & Cumulative Performance Visualizations**:
   - **Cumulative S-Curve**: Trajectory line comparing Planned vs Achieved progress across the full fiscal year.
   - **Monthly Variance Bar Chart**: Month-by-month Planned vs Actual performance with auto-calculated run-rates.
4. **Schedule Performance & Quality Ratings**:
   - Displays SPI (Schedule Performance Index), Quality Rating, Safety Rating, and Average QHSE Rating.
5. **Month-by-Month Metric Table**:
   - Detailed 12-month breakdown table showing Plan, Achieved, and Variance % with status color badges.
6. **Attention Needed / Critical Projects Section**:
   - Pinpoints lagging projects, computes critical scores, and provides automated diagnostic comments.

---

### 6.2 Monthly Review Meeting (MRM) Dashboard (`leader`)
**Designed for Executive Board Meetings & Leadership Reviews**

#### Key Features:
1. **Executive VP & General Manager Grouping**:
   - Projects are grouped under their respective Executive VP and Project Leader hierarchies.
2. **Dynamic 8-Stage Lifecycle Grouping**:
   - Projects are categorized into 8 lifecycle stages:
     1. **Upcoming**
     2. **Design**
     3. **Excavation**
     4. **Construction Start**
     5. **Ongoing (Structure / Core)**
     6. **Finishing / MEP**
     7. **Handover / Closeout**
     8. **On Hold / Stalled**
   - Hovering over any stage badge displays a tooltip listing all project names and codes in that stage.
3. **Interactive Leader Review Slide Deck**:
   - Formats project data into presentation slides ready for board review.
4. **Single-Click Executive PDF Export**:
   - Generates a presentation-ready A4 landscape PDF slide deck.

---

### 6.3 Executive Performance Leaderboard (`leaderboard`)
**Benchmarking, Rankings, and Efficiency Diagnostics**

#### Key Features:
1. **3-Tier Category Rankings**:
   - **VP Level**: Compare performance across Executive VPs.
   - **Leader Level**: Rank General Managers and Project Leaders.
   - **Project Level**: Site-by-site rankings across all developments.
2. **Composite Efficiency Score & Letter Grades**:
   - Assigns dynamic composite scores ($0–100$) and letter grades:
     - **A+ (90–100%)**: Outstanding Execution
     - **A (75–89%)**: On Track
     - **B (60–74%)**: Moderate Slippage
     - **C (<60%)**: Critical Intervention Required
3. **Advanced Construction Benchmark KPIs**:
   - **Labour Productivity**: $\text{₹} / \text{Labour} / \text{Day}$
   - **Labour Efficiency**: $\text{₹}\text{ Cr. per 100 labours deployed}$
   - **Speed of Construction**: $\text{₹} / \text{Sqft} / \text{Month}$
   - **Average SPI**: Schedule adherence indicator.
4. **Multi-Column Sorting & CSV Export**:
   - Sort by any metric ascending/descending and export the ranked table to CSV.

---

### 6.4 Milestone Analysis & Site Diagnostics (`milestones`)
**10-Parameter Constraint Diagnostics & Aging Backlog Analysis**

#### Key Features:
1. **Chronological Backlog Aging Filter**:
   - Filter milestones by aging horizon (e.g. Apr 26, May 26, Jun 26, Jul 26, Aug 26) to focus on overdue tasks.
2. **10-Parameter Constraint Assessment Engine**:
   Evaluates 10 critical operational blockers for every pending milestone:
   1. **Contractor Appointment**: Status of work orders and contractor awarding.
   2. **Drawing / GFC Release**: Availability of Good For Construction (GFC) engineering drawings.
   3. **Work Front Availability**: Site readiness and access to physical work fronts.
   4. **Contractor Mobilization**: On-site mobilization of plant, machinery, and teams.
   5. **Material Delivery**: Procurement and on-site delivery of raw materials.
   6. **Labour Availability**: Adequate skilled/unskilled worker deployment.
   7. **Client Decision**: Approvals and selections pending from the developer/client.
   8. **Government Approval / NOC**: Municipal, environmental, or fire department clearances.
   9. **CRM Handover Clearance**: Snagging clearance and client handover sign-offs.
   10. **Other Constraints**: Site-specific or external roadblocks.
3. **Intelligent Bottleneck Detection & Automated Recommendations**:
   - Automatically highlights the primary failing constraint and suggests actionable engineering solutions.
4. **Weekly Execution Schedules**:
   - Filters tasks by planned execution week: **W1, W2, W3, or W4**.
5. **CSV Milestone Export**:
   - Export filtered milestone lists and constraint notes for on-ground site teams.

---

### 6.5 Key Insights & Multi-Horizon Delivery Forecast (`insights`)
**Predictive Horizon Modeling & Slippage Run-Rate Analysis**

#### Key Features:
1. **Completed Horizon vs Forecast Horizon**:
   - **Completed Horizon** (Closed Months): Analyzes historical delivery and cumulative variance.
   - **Forecast Horizon** (Upcoming Months): Forecasts future requirements through the end of the fiscal year.
2. **3-Layer Interactive Drilldown**:
   - Slices forecasts by **Organization ➜ Leader ➜ Individual Project**.
3. **Scenario Modeling**:
   - Evaluates delivery under **Optimistic**, **Most Likely**, and **Pessimistic** run-rate scenarios.
4. **Slippage Gap Diagnostics**:
   - Calculates the exact catch-up run-rate required per remaining month to achieve baseline targets.

---

### 6.6 Executive VP Portfolios (`vp`)
**Executive Leadership Scorecards & Workload Distribution**

#### Key Features:
- Aggregated health scorecards for each Executive VP.
- Visual breakdown of project count, total square footage, and budget under management.
- Status distribution (Green/Amber/Red) and direct report allocation across leaders.

---

### 6.7 Master Project Registry Matrix (`all`)
**Global Searchable Project Database**

#### Key Features:
- Tabular directory of all registered projects.
- Search by project code, project name, leader, VP, or location.
- Status badges and single-click access to the **Project Details Modal Drawer** for deep dive inspection.

---

### 6.8 Data Configuration & Column Mapping (`overview` - Admin Only)
**Spreadsheet Ingestion Configuration & Custom Column Mapping**

#### Key Features:
- **Header Row Detection**: Adjust the header row index to match your spreadsheet layout.
- **Interactive Column Mapping**: Map spreadsheet columns to system fields (Code, Name, Leader, VP, Area, Stage, Budget, VOWD, Milestones, Labour, UR, UC).
- **Metric Column Overrides**: Map specific monthly columns to custom spreadsheet positions.

---

### 6.9 User Management & Permission Scoping (`userAccess` - Admin Only)
**Enterprise User Administration & Data Scoping**

#### Key Features:
1. **User Account Administration**:
   - Add new users, edit display names, update passwords, and delete accounts.
2. **Granular Navigation Tab Permissions**:
   - Choose exactly which tabs each user can see.
3. **Feature Permissions**:
   - Grant or restrict permissions for:
     - `Live Spreadsheet Sync`
     - `PDF Report Export`
     - `Data Configuration Editing`
     - `Fiscal Year Changing`
4. **Scoped Data Whitelisting**:
   - Restrict specific users to only view:
     - Specific Executive VPs
     - Specific Project Leaders
     - Specific Project Codes
5. **Bulk CSV Import & Export**:
   - Import multiple user accounts at once via CSV templates, or export user access matrices.

---

## 7. Executive Presentation Slide Deck & PDF Export Engine

The built-in reporting engine converts live dashboard data into professional A4 landscape executive slide decks.

### Export Workflow:
1. Navigate to the **MRM Dashboard (`leader`)** tab.
2. Click the **Export PDF Report** button in the upper toolbar.
3. In the export modal:
   - Customize the **Report Title** (defaults to *"Planedge Monthly Review Meeting (MRM)"*).
   - Set the **Meeting Date / Cycle**.
   - Select the target **Executive VP** or **Project Leader** slide scope.
4. Click **Generate PDF**. The system compiles the slides and downloads a high-resolution A4 landscape document.

---

## 8. Executive Metrics & Mathematical Formulations

$$\text{Speed of Construction} = \left( \frac{\text{Achieved VOWD of Under-Construction Projects}}{\text{Area of Under-Construction Projects (Sqft)}} \right) \times 10^7 \quad (\text{₹}/\text{Sqft}/\text{Month})$$

$$\text{Labour Productivity} = \left( \frac{\text{Achieved VOWD}}{\text{Total Labour Headcount}} \right) \times 10^7 \quad (\text{₹}/\text{Lab.}/\text{Day})$$

$$\text{Labour Efficiency} = \frac{\text{Achieved VOWD}}{\text{Total Labour Headcount} / 100} \quad (\text{Cr. per 100 Labours})$$

$$\text{Schedule Performance Index (SPI)} = \frac{\text{Earned Value (Achieved)}}{\text{Planned Value (Target Baseline)}}$$

$$\text{Milestone Completion Rate (\%)} = \left( \frac{\text{Done Milestones}}{\text{Total Planned Milestones}} \right) \times 100$$

$$\text{Composite Benchmark Score} = 0.35(\text{VOWD \%}) + 0.25(\text{Milestone \%}) + 0.20(\text{Labour \%}) + 0.10(\text{UR \%}) + 0.10(\text{UC \%})$$

---

## 9. Troubleshooting & Frequently Asked Questions (FAQs)

### Q1: Why is the dashboard showing "Database Access Issue" or mock data?
**Solution**: Ensure that your Google Sheet has sharing settings configured to *"Anyone with the link can view"*, or verify that your internet connection is active. Click **Synchronize Live Spreadsheet** to re-fetch live data.

### Q2: Why can't a user see certain tabs or projects?
**Solution**: An administrator may have scoped the user's account to specific tabs, VPs, or project codes. An admin can update these permissions in the **User Access (`userAccess`)** tab.

### Q3: How do I change the active Fiscal Year?
**Solution**: Click the Fiscal Year dropdown in the top header bar (e.g. `FY26-27`) and select the desired fiscal year. All charts, metrics, and monthly tables will update automatically.

### Q4: How do I export data to Excel or CSV?
**Solution**: Both the **Leaderboard** and **Milestone Analysis** views include a **Download CSV** button to export the active filtered dataset.

---
*Planedge Executive Dashboard • Enterprise Monthly Review Meeting (MRM) System*
