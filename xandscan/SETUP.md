# XandScan Setup Guide

Complete guide to get XandScan working with all features.

## Prerequisites

- Node.js 18+ 
- Supabase account (free tier works)
- Vercel account (for deployment)

## 1. Database Setup

### Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to SQL Editor
4. Run the schema from `supabase/schema.sql`:

```bash
# Copy and paste the entire schema.sql file into Supabase SQL Editor
# Or use the Supabase CLI:
supabase db push
```

### Verify Tables

Run these queries to verify:

```sql
-- Should show 2 tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should show 6 indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public';
```

## 2. Environment Variables

Create `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Cron Secret (generate a random string)
CRON_SECRET=your_random_secret_here

# Optional: Custom RPC Endpoint
RPC_ENDPOINT_PRIMARY=http://161.97.97.41:6000/rpc
```

**Get Supabase credentials:**
1. Go to your Supabase project
2. Settings → API
3. Copy "Project URL" and "anon public" key

## 3. Install Dependencies

```bash
cd xandscan
npm install
```

## 4. Local Development

```bash
npm run dev
```

Visit `http://localhost:3000`

## 5. Initial Data Sync

The first time you load the dashboard:

1. Click "REFRESH DATA" button
2. Wait 30-60 seconds for initial sync
3. Data will populate automatically

**Or manually trigger:**

```bash
# For devnet
curl http://localhost:3000/api/cron/update-nodes?network=devnet \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# For mainnet  
curl http://localhost:3000/api/cron/update-nodes?network=mainnet \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 6. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd xandscan
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables
```

## 7. Setup Cron Jobs

Use a free cron service to keep data fresh:

### Option A: Cron-job.org (Recommended)

1. Go to [cron-job.org](https://cron-job.org)
2. Create account
3. Create two jobs:

**Devnet Job:**
- URL: `https://your-app.vercel.app/api/cron/update-nodes?network=devnet`
- Schedule: Every 5 minutes
- Method: GET
- Add header: `Authorization: Bearer YOUR_CRON_SECRET`

**Mainnet Job:**
- URL: `https://your-app.vercel.app/api/cron/update-nodes?network=mainnet`
- Schedule: Every 5 minutes
- Method: GET
- Add header: `Authorization: Bearer YOUR_CRON_SECRET`

### Option B: UptimeRobot

1. Create HTTP(s) monitor
2. URL: Your cron endpoint
3. Interval: 5 minutes
4. Add custom HTTP header with your secret

### Option C: GitHub Actions (Free)

Create `.github/workflows/cron.yml`:

```yaml
name: Update Nodes
on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Update Devnet
        run: |
          curl -X GET https://your-app.vercel.app/api/cron/update-nodes?network=devnet \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
      
      - name: Update Mainnet
        run: |
          curl -X GET https://your-app.vercel.app/api/cron/update-nodes?network=mainnet \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Features Overview

### ✅ Working Features

- **Network Switching**: Toggle between Mainnet and Devnet
- **Live Stats**: Total nodes, active RPC, storage, top country
- **Node Table**: 
  - Sortable columns
  - CPU and RAM usage display
  - Storage metrics
  - Credits and scoring
  - Pagination
- **Scoring System**: Ranks nodes by uptime, credits, version, resources
- **Global Map**: Shows node geographic distribution
- **Auto-refresh**: Click button to sync latest data
- **Search**: Filter nodes by country, IP, etc.

### 📊 Data Displayed

- **Pubkey**: Node identifier
- **Location**: Country with flag
- **Version**: Software version
- **CPU**: Processor usage percentage
- **RAM**: Memory usage percentage
- **Storage**: Committed storage
- **Credits**: Pod credits
- **Score**: Calculated ranking (0-100)
- **Last Seen**: Time since last update

### 🎯 Ranking Logic

Nodes are scored based on:
1. **Uptime (40%)**: Longer uptime = higher score
2. **Credits (30%)**: More credits = higher score
3. **Version (20%)**: Latest version = higher score
4. **Resources (10%)**: Lower CPU usage = higher score

## Troubleshooting

### No data showing

1. Check Supabase tables have data:
```sql
SELECT COUNT(*) FROM nodes;
SELECT COUNT(*) FROM snapshots;
```

2. Manually trigger sync:
```bash
curl http://localhost:3000/api/cron/update-nodes?network=devnet \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

3. Check browser console for errors

### CPU/RAM showing as "-"

This is normal if:
- RPC endpoint is down
- Node doesn't respond to stats requests
- Data is older than 15 minutes

Solution: Wait for next cron sync

### Network switch not working

1. Clear browser cache
2. Check Network context provider is in layout
3. Verify API endpoints accept `network` parameter

### Slow performance

1. Verify all indexes are created:
```sql
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

2. Check snapshot count:
```sql
SELECT COUNT(*) FROM snapshots;
```

If > 100k rows, consider cleanup:
```sql
-- Keep only last 7 days
DELETE FROM snapshots 
WHERE created_at < NOW() - INTERVAL '7 days';
```

## API Endpoints

| Endpoint | Method | Parameters | Description |
|----------|--------|------------|-------------|
| `/api/nodes` | GET | `network`, `search`, `sort_by`, `order` | Get all nodes with stats |
| `/api/network-stats` | GET | `network` | Get aggregated statistics |
| `/api/cron/update-nodes` | GET | `network` | Trigger data sync (requires auth) |

## Credits

- Data from Xandeum Network RPC nodes
- Credits API: `podcredits.xandeum.network`
- Geolocation: `ip-api.com`

## License

MIT
