# Investigation Findings: CPU/RAM Not Showing

## TL;DR - THE REAL PROBLEM

**The RPC endpoint `get-pods-with-stats` does NOT return CPU or RAM data!**

The RPC response looks like this:
```json
{
  "address": "31.220.99.33:9001",
  "pubkey": "8hYohqvLZHnBSzYGS7yR4RqVdA9hZU48KmEsycY4qcCk",
  "version": "1.2.0",
  "uptime": 217067,
  "storage_committed": 175000000000,
  "storage_used": 0,
  "rpc_port": 6000,
  "is_public": false,
  "last_seen_timestamp": 1767520017
}
```

**NO `cpu` field, NO `memory` field!**

## What This Means

1. ✅ **XandScan is working correctly** - it's storing the data it receives (which is 0)
2. ✅ **Our code is correct** - field mapping, database, API all work as expected
3. ❌ **The RPC doesn't provide CPU/RAM stats** - at least not for DevNet

## Evidence from Logs

### XandScan Indexer Logs
```
[INDEXER] Sample pod data: {
  "address": "31.220.99.33:9001",
  ...
  "uptime": 217067,
  "version": "1.2.0"
  // NO cpu or memory fields!
}

[INDEXER] Node 8hYohqvL: cpu=0, ram=0/8589934592, uptime=217067, rpc_active=true
```

Our code correctly interprets missing fields as 0.

### XandScan API Response
```json
{
  "stats": {
    "version": "1.2.0",
    "cpu_percent": 0,  ← Correctly stored as 0
    "ram_used": 0,      ← Correctly stored as 0
    "ram_total": 8589934592,
    "uptime_seconds": 217067
  }
}
```

### XandScan Frontend
Shows "-" for 0 values, which is correct behavior per our code:
```tsx
{typeof cpu === 'number' ? `${cpu}%` : '-'}
```

## Why You See Data in Xandash

**Theory 1: Xandash uses a different RPC endpoint**
- Maybe it calls individual node RPCs for stats
- Or uses a different method that returns CPU/RAM

**Theory 2: Xandash uses MainNet, not DevNet**
- MainNet RPCs might return CPU/RAM data
- DevNet RPCs might not be configured to return stats

**Theory 3: Xandash makes additional RPC calls**
- After getting node list, it queries each node's RPC
- Individual node RPC endpoints (e.g., `http://1.2.3.4:6000/metrics`) might return stats

## What To Do Next

### Option A: Test with MainNet
```bash
# Trigger MainNet sync
curl http://localhost:3000/api/cron/update-nodes?network=mainnet \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
  
# Then check if MainNet has CPU/RAM data
curl http://localhost:3000/api/nodes?network=mainnet
```

### Option B: Check Xandash Implementation
1. Start Xandash on port 3001
2. Check what data it returns
3. Look at its network tab to see what RPC calls it makes
4. Compare with XandScan's RPC calls

### Option C: Query Individual Node RPCs
The bulk RPC `get-pods-with-stats` might not include stats, but individual node RPCs might:

```bash
# Try querying a specific node's RPC endpoint
curl -X POST http://31.220.99.33:6000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"get-metrics","params":[]}'
```

## Bottom Line

**XandScan is NOT broken**. The issue is:
- RPC endpoint doesn't provide CPU/RAM data (at least for DevNet)
- Both projects likely face the same issue
- Need to investigate how Xandash gets CPU/RAM data (if it actually does)

## Next Steps

1. **Verify Xandash actually shows CPU/RAM data**:
   - Start Xandash
   - Check if CPU/RAM columns have values or also show "-"
   
2. **Check MainNet vs DevNet**:
   - Test if MainNet RPC returns CPU/RAM data
   
3. **Individual Node Queries**:
   - Test if querying individual node RPC endpoints returns stats
   - Implement per-node RPC queries if needed

4. **Accept the limitation**:
   - If RPC doesn't provide it, document that CPU/RAM isn't available
   - Focus on other metrics that ARE available (uptime, version, storage, credits)
