# 🛰️ XandScan - Xandeum Network Intelligence & Telemetry

![Status](https://img.shields.io/badge/Network-Operational-green) ![Nodes](https://img.shields.io/badge/Nodes-Tracked-blue) ![License](https://img.shields.io/badge/License-MIT-purple)

**XandScan** is the official decentralized analytics platform for the Xandeum pNode network. It aggregates, indexes, and visualizes real-time performance and geolocation data from distributed nodes, while providing a suite of power-user tools for developers and storage providers.

---

## ⚡ Developer Nexus (New)

A dedicated suite of utilities designed for node operators and ecosystem developers, accessible via the `NEXUS` portal.

### 1. **MarketPulse 📈**
Real-time financial intelligence for the Xand ecosystem.
*   **Live Ticker**: Tracks Price, Volume, and Market Cap with instant updates.
*   **Performance Metrics**: 24h, 7d, 30d, and 1y price performance analysis.
*   **Tokenomics**: Circulating supply vs Max supply visualization and ATH comparisons.
*   **Smart Links**: Quick copy for contract addresses and vetted social links.

### 2. **Network Diagnostics 🖥️**
A CLI-style termination interface for verifying network integrity.
*   **Endpoint Testing**: Test RPC methods (`get-version`, `get-stats`, `get-pods`) and API endpoints (`pod-credits`) in real-time.
*   **Latency Tracking**: Millisecond-precision response time measurements.
*   **Payload Inspector**: Drill down into raw JSON responses for debugging.
*   **Status Codes**: Visual feedback for service availability and error states.

### 3. **Profit Simulator 💰**
Advanced yield estimation engine for Storage Providers.
*   **Geometric Mean Logic**: Implementing the precise reward formula: `(Storage^0.4) * (Stake^0.6) * Performance`.
*   **Boost Modules**: Simulate the impact of **NFT Multipliers** (Gold, Platinum) and **Era Bonuses** (Genesis, Expansion).
*   **Visual Projections**: Radial gauge visualization for epoch-based earnings with monthly/yearly extrapolations.

---

## 🛠️ Core Capabilities & Telemetry

### 1. **Smart Ranking Algorithm (v2)**
A newly rebalanced scoring system to fairness and performance:
*   **Performance (40%)**: Heavily weighted towards high RAM (>64GB) and Storage (>1TB).
*   **Reliability (30%)**: Uses a **Square-Root Curve** (not linear), allowing new high-quality nodes to reach respectable scores in ~2 days while still rewarding long-term stability (7-day target).
*   **Version (20%)**: Strict penalties for legacy software (`v0.x`), incentivizing upgrades to `v1.x`.
*   **Decentralization (10%)**: Geographic scoring that penalizes ISP/Country concentration >30%.

### 2. **Hardware & Resource Telemetry**
*   **CPU Load**: Real-time processor utilization.
*   **Memory & Storage**: Granular usage analysis.
*   **Uptime**: Session uptime tracking with historic averaging.

### 3. **Geospatial Intelligence**
*   **Global Map**: Interactive real-time map of all active nodes.
*   **Country Flags**: Automatic country code resolution for visual identity.
*   **ISP Attribution**: Detects cloud provider concentration (AWS vs Residential).

### 4. **Deep-Dive Comparison**
*   **Multi-Select**: Compare up to 4 nodes side-by-side.
*   **Metric Diffing**: Auto-highlighting of "Best in Class" specs.

---

## 💻 Technical Architecture

*   **Frontend**: Next.js 15 (React 19, Server Actions)
*   **Styling**: TailwindCSS, Framer Motion (Animations), Lucide React (Icons), Sonner (Toasts)
*   **Visualization**: Mapbox GL JS, Custom SVG Gauges & Charts.
*   **Data Store**: Supabase (PostgreSQL)
*   **Indexing**: Serverless "Visitor-Driven" indexing with background polling.

---

## 🚀 Deployment & Setup

### Environment Variables
```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ... # Mapbox Public Key
NEXT_PUBLIC_SUPABASE_URL=...             # Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # Supabase Anon Key
```

### Installation
```bash
git clone https://github.com/xandeum/xandscan.git
cd xandscan
npm install
npm run dev
```

---

## 📄 License
MIT
