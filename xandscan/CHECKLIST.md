# XandScan - Quick Setup Checklist

## ✅ Pre-Deployment Checklist

### 1. Database Setup in Supabase

- [ ] Create Supabase project
- [ ] Go to SQL Editor
- [ ] Run entire `supabase/schema.sql` file
- [ ] Verify tables created:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public';
  ```
  Should show: `nodes`, `snapshots`

- [ ] Verify indexes created:
  ```sql
  SELECT indexname FROM pg_indexes 
  WHERE schemaname = 'public';
  ```
  Should show 6 indexes

### 2. Environment Variables

- [ ] Get Supabase URL (Settings → API → Project URL)
- [ ] Get Supabase anon key (Settings → API → anon public)
- [ ] Generate random CRON_SECRET (use password generator)
- [ ] Create `.env.local` file with:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
  CRON_SECRET=your_random_secret_here
  ```

### 3. Local Testing

- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Visit `http://localhost:3000`
- [ ] Click "REFRESH DATA" button
- [ ] Wait 30-60 seconds
- [ ] Verify nodes appear in table
- [ ] Check CPU, RAM, Storage columns show data
- [ ] Test network toggle (MAINNET ↔ DEVNET)

### 4. Deploy to Vercel

- [ ] Push code to GitHub
- [ ] Connect repo to Vercel
- [ ] Add environment variables in Vercel dashboard
- [ ] Deploy
- [ ] Test production URL

### 5. Setup Cron Jobs

#### Option A: cron-job.org
- [ ] Create account at [cron-job.org](https://cron-job.org)
- [ ] Create Job #1:
  - Title: "XandScan Devnet Sync"
  - URL: `https://your-app.vercel.app/api/cron/update-nodes?network=devnet`
  - Schedule: Every 5 minutes
  - HTTP Method: GET
  - Add header: `Authorization: Bearer YOUR_CRON_SECRET`
  
- [ ] Create Job #2:
  - Title: "XandScan Mainnet Sync"
  - URL: `https://your-app.vercel.app/api/cron/update-nodes?network=mainnet`
  - Schedule: Every 5 minutes
  - HTTP Method: GET
  - Add header: `Authorization: Bearer YOUR_CRON_SECRET`

#### Option B: UptimeRobot
- [ ] Create HTTP(s) monitor for devnet endpoint
- [ ] Create HTTP(s) monitor for mainnet endpoint
- [ ] Set interval to 5 minutes each

### 6. Verification

- [ ] Wait 5-10 minutes for cron to run
- [ ] Check Supabase tables:
  ```sql
  -- Should have nodes
  SELECT COUNT(*) FROM nodes;
  
  -- Should have recent snapshots
  SELECT COUNT(*) FROM snapshots 
  WHERE created_at > NOW() - INTERVAL '15 minutes';
  ```

- [ ] Visit app and verify:
  - [ ] Total Nodes shows count > 0
  - [ ] Active RPC shows count > 0
  - [ ] Node table populated
  - [ ] CPU/RAM columns show percentages
  - [ ] Map shows node locations
  - [ ] Network toggle works
  - [ ] Sorting works
  - [ ] Search works

## 🐛 Troubleshooting

### No data showing
```bash
# Manually trigger sync
curl https://your-app.vercel.app/api/cron/update-nodes?network=devnet \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### CPU/RAM showing "-"
- Normal if RPC is down
- Wait for next sync cycle
- Check if `rpc_active = true` in snapshots table

### Slow performance
```sql
-- Check indexes
SELECT * FROM pg_indexes WHERE schemaname = 'public';

-- Should see 6 indexes
```

### Network toggle not working
- Clear browser cache
- Check browser console for errors
- Verify NetworkProvider in layout.tsx

## 📊 Expected Data After Setup

### Supabase `nodes` table:
- ~50-100 nodes (depends on network)
- Fields: pubkey, ip_address, country, city, latitude, longitude

### Supabase `snapshots` table:
- New row every 5-10 minutes per node
- Fields: cpu_percent, ram_used, ram_total, storage_used, total_score

### Dashboard:
- Total Nodes: 50+ (devnet) or 100+ (mainnet)
- Active RPC: 30-80% of total
- Storage: Several GB
- Top Country: Usually Germany or Netherlands

## ✨ Success Indicators

- [ ] Node table shows 20+ nodes
- [ ] CPU column shows percentages (e.g., "45.2%")
- [ ] RAM column shows percentages (e.g., "67.8%")
- [ ] Score column shows values (e.g., "78.5")
- [ ] Map displays pins for each node
- [ ] Stats cards show real numbers
- [ ] Network toggle changes data
- [ ] Auto-refresh works every 5 minutes

## 🎉 You're Done!

If all checkboxes are checked, XandScan is fully operational!

For detailed information, see:
- [SETUP.md](SETUP.md) - Full setup guide
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database details
- [CHANGES.md](CHANGES.md) - What was fixed
