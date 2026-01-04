# XandScan Debugging & Testing Guide

## Problem
CPU and RAM data shows as "-" in XandScan even though it's visible in Xandash.

## Root Cause Analysis

### How Xandash Works
- **Direct RPC Fetch**: Calls `get-pods-with-stats` and returns raw data
- **No Database Join**: Data comes directly from RPC response
- **Fields**: RPC returns `cpu` and `memory` fields

### How XandScan Works  
- **Database Storage**: Stores data in Supabase (nodes + snapshots tables)
- **Data Join**: Joins nodes table with snapshots table
- **Fields**: Maps `cpu` → `cpu_percent`, `memory` → `ram_used`

## Fixes Applied

### 1. Fixed Field Mapping in Indexer
**File**: `src/lib/indexer.ts`

```typescript
// BEFORE (WRONG):
cpu_percent: node.cpu_percent ?? node.cpu ?? 0,
ram_used: node.memory_used ?? node.memory ?? 0,

// AFTER (CORRECT):
const cpu = node.cpu ?? node.cpu_percent ?? 0;
const memory = node.memory ?? node.memory_used ?? 0;
// Use cpu and memory variables
```

### 2. Added Debug Logging
- Sample RPC pod structure
- First 3 processed nodes
- First 2 snapshot inserts
- API response structure

### 3. Created Debug Endpoint
**URL**: `/api/debug/snapshots`
Shows recent snapshots and whether they have CPU/RAM data.

## Testing Steps

### Step 1: Clear Old Data (Optional but Recommended)
```sql
-- Run in Supabase SQL Editor
DELETE FROM snapshots WHERE created_at < NOW() - INTERVAL '1 hour';
```

### Step 2: Trigger Fresh Data Sync

#### Option A: Via Dashboard
1. Go to http://localhost:3000 (or your deployed URL)
2. Click "REFRESH DATA" button
3. Wait 30-60 seconds
4. Check browser console and server logs

#### Option B: Via API Call
```bash
# For DevNet
curl http://localhost:3000/api/cron/update-nodes?network=devnet \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# For MainNet  
curl http://localhost:3000/api/cron/update-nodes?network=mainnet \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Step 3: Check Server Logs

Look for these log messages:

#### A. RPC Response Sample
```
[INDEXER] Sample pod data: {
  "id": "ABC123...",
  "address": "1.2.3.4:6000",
  "cpu": 45.2,        ← Should see "cpu" field
  "memory": 2147483648, ← Should see "memory" field
  "uptime": 86400,
  "version": "0.7.3"
}
```

#### B. Normalized Node Data
```
[INDEXER] Node ABC123: cpu=45.2, ram=2147483648/8589934592, uptime=86400, rpc_active=true
```

#### C. Snapshot Insert
```
[INDEXER] Inserting snapshot for ABC123: {
  "node_pubkey": "ABC123...",
  "cpu_percent": 45.2,     ← Should have value
  "ram_used": 2147483648,  ← Should have value
  "ram_total": 8589934592,
  ...
}
```

### Step 4: Check Debug Endpoint
```bash
curl http://localhost:3000/api/debug/snapshots
```

**Expected Response**:
```json
{
  "recentSnapshots": [...],
  "snapshotsWithCpu": [...],  ← Should have items
  "summary": {
    "totalRecent": 50,
    "withCpuData": 50,      ← Should match totalRecent
    "sampleSnapshot": {
      "cpu_percent": 45.2,   ← Should have value
      "ram_used": 2147483648,
      ...
    }
  }
}
```

### Step 5: Check Database Directly

Run in Supabase SQL Editor:

```sql
-- Check recent snapshots
SELECT 
  node_pubkey,
  cpu_percent,
  ram_used,
  ram_total,
  version,
  rpc_active,
  created_at
FROM snapshots 
WHERE created_at > NOW() - INTERVAL '15 minutes'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Results**:
- ✅ cpu_percent has numbers (not NULL)
- ✅ ram_used has numbers (not NULL)  
- ✅ ram_total has numbers (not NULL)
- ✅ rpc_active is TRUE for most nodes

### Step 6: Check API Response
```bash
curl http://localhost:3000/api/nodes?network=devnet
```

Look for in the response:
```json
[
  {
    "pubkey": "ABC123...",
    "ip_address": "1.2.3.4",
    "country": "Germany",
    "stats": {
      "cpu_percent": 45.2,    ← Should have value
      "ram_used": 2147483648,  ← Should have value
      "ram_total": 8589934592,
      "version": "0.7.3",
      "total_score": 78.5
    }
  }
]
```

### Step 7: Check Frontend Display

1. **Refresh browser** (hard refresh: Ctrl+Shift+R)
2. **Check table columns**:
   - CPU column should show "45.2%" not "-"
   - RAM column should show "68%" not "-"
   - Version should show actual version
   - Score should show calculated value

## Troubleshooting

### Issue: Still showing "-" after sync

#### Cause 1: RPC doesn't return cpu/memory fields
**Check**: Look at `[INDEXER] Sample pod data` log
**Fix**: If fields are missing, the RPC endpoint may not support stats

#### Cause 2: Data not being saved to database
**Check**: Run SQL query above
**Fix**: Check Supabase permissions and logs

#### Cause 3: Using old data (>15 minutes)
**Check**: Dashboard only shows data from last 15 minutes
**Fix**: Trigger fresh sync

#### Cause 4: Wrong network selected
**Check**: Network toggle matches the data you synced
**Fix**: If you synced devnet, make sure devnet is selected

### Issue: Some nodes have data, some don't

This is **NORMAL** if:
- Some nodes don't respond to RPC stats requests
- Some nodes are offline
- `rpc_active = false` for those nodes

Check the `rpc_active` field in database.

## Common Mistakes

### ❌ WRONG: Expecting all nodes to have CPU/RAM
- Not all nodes expose stats via RPC
- Offline nodes won't have current stats
- This is normal behavior

### ❌ WRONG: Not waiting for sync to complete
- Sync can take 30-60 seconds
- Need to wait before checking results

### ❌ WRONG: Looking at old data
- Frontend only shows last 15 minutes
- Database may have old snapshots
- Always check `created_at` timestamp

### ❌ WRONG: Testing with wrong network
- If you synced devnet, view devnet
- If you synced mainnet, view mainnet
- Toggle must match!

## Success Criteria

✅ Server logs show CPU/RAM in RPC response  
✅ Server logs show CPU/RAM in normalized data  
✅ Database has cpu_percent and ram_used values  
✅ API returns nodes with stats.cpu_percent  
✅ Frontend displays percentages in table  
✅ At least 50% of nodes show CPU/RAM data

## Environment Variables Check

Make sure these are set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
CRON_SECRET=your_secret_here
```

## Quick Verification Script

Run this after deployment:

```bash
# 1. Trigger sync
curl http://localhost:3000/api/cron/update-nodes?network=devnet \
  -H "Authorization: Bearer $CRON_SECRET"

# 2. Wait 60 seconds
sleep 60

# 3. Check debug endpoint  
curl http://localhost:3000/api/debug/snapshots | jq '.summary'

# 4. Check API
curl http://localhost:3000/api/nodes?network=devnet | jq '.[0].stats'
```

Expected output shows CPU/RAM values, not nulls.

## Final Notes

- The fixes are in place
- You MUST trigger a fresh sync for new data
- Old data won't have CPU/RAM  
- Some nodes legitimately don't provide stats
- Check logs to verify the issue, don't just assume

If after following ALL steps above you still don't see data, provide:
1. Server log output from sync
2. SQL query results  
3. Debug endpoint response
4. API endpoint response sample
