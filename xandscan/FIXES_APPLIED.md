# Critical Fixes Applied to XandScan

## 🔧 Issue: CPU and RAM Not Displaying

### Root Cause
The RPC endpoint returns fields named `cpu` and `memory`, NOT `cpu_percent` and `memory_used`. The original code was looking for the wrong field names.

### Fix Applied
Updated `src/lib/indexer.ts` in the `normalizeNodeStats()` function:

```typescript
// OLD (WRONG):
cpu_percent: node.cpu_percent ?? node.cpu ?? 0,
ram_used: node.memory_used ?? node.memory ?? 0,

// NEW (CORRECT):
const cpu = node.cpu ?? node.cpu_percent ?? 0;
const memory = node.memory ?? node.memory_used ?? 0;
// Then use these values
```

### How RPC Data Works
According to Xandash's implementation:
- RPC returns: `cpu` (not `cpu_percent`)
- RPC returns: `memory` (not `memory_used`)
- These are the actual field names in the `get-pods-with-stats` response

## 🔧 Issue: Version Display Wrong

### Root Cause
The network version detection was failing when there were no valid versions, causing the version comparison to fail.

### Fix Applied
Improved version detection logic:

```typescript
// Better filtering and fallback
const versions = normalizedNodes.map(n => n.version).filter(v => v && v !== 'Unknown');
const networkVersion = Object.keys(versionCounts).length > 0
  ? Object.keys(versionCounts).reduce((a, b) => ...)
  : 'Unknown';
```

Added debug logging to see what versions are detected:
```typescript
console.log(`[INDEXER] Network version: ${networkVersion} (versions found: ${JSON.stringify(versionCounts)})`);
```

## 🔧 Issue: RPC Active Detection

### Root Cause
All nodes were marked as `rpc_active = true` by default, which was incorrect.

### Fix Applied
Proper RPC active detection based on actual data:

```typescript
// Check if node actually has stats
const rpc_active = (cpu_percent !== null && cpu_percent !== undefined) || 
                   (ram_used !== null && ram_used !== undefined && ram_used > 0) || 
                   (uptime !== null && uptime !== undefined && uptime > 0);
```

## 🔧 Issue: Missing Memory Total

### Root Cause
When `memory_total` is not provided by RPC, we had no fallback value.

### Fix Applied
Smart fallback for memory total:

```typescript
const memoryTotal = node.memory_total ?? (memory > 0 ? memory * 1.5 : 8589934592);
// If memory is being used, estimate total as 1.5x used
// Otherwise default to 8GB
```

## 📊 Expected Data Flow

1. **RPC Call**: `get-pods-with-stats` returns array of pods
2. **Sample Pod Structure**:
```json
{
  "id": "ABC123...",
  "address": "1.2.3.4:6000",
  "version": "0.7.3",
  "cpu": 45.2,
  "memory": 2147483648,
  "uptime": 86400,
  "storage_committed": 10737418240,
  "status": "online"
}
```

3. **Normalization**: Convert to our schema
```typescript
{
  cpu_percent: 45.2,
  ram_used: 2147483648,
  ram_total: 8589934592,
  uptime: 86400,
  storage_used: 10737418240,
  version: "0.7.3",
  pubkey: "ABC123...",
  address: "1.2.3.4:6000"
}
```

4. **Database**: Store in `snapshots` table
5. **Display**: Show in NodesTable component

## 🐛 Debug Logging Added

To help troubleshoot issues, added logging:

```typescript
// Log sample pod structure
if (res.data.result.pods.length > 0) {
  console.log(`[INDEXER] Sample pod data:`, JSON.stringify(res.data.result.pods[0], null, 2));
}

// Log first few processed nodes
if (processedCount < 3) {
  console.log(`[INDEXER] Node ${pubkey}: cpu=${cpu_percent}, ram=${ram_used}, uptime=${uptime}, rpc_active=${rpc_active}`);
}
```

## ✅ What Should Work Now

1. **CPU Display**: Shows percentage (e.g., "45.2%")
2. **RAM Display**: Shows percentage with tooltip
3. **Version Display**: Shows correct version for each node
4. **Version Matching**: Nodes with network version get score bonus
5. **RPC Active**: Only nodes with actual stats marked as active
6. **Scoring**: Proper calculation based on real data

## 🧪 Testing

After deploying these changes:

1. **Trigger Update**:
```bash
curl https://your-app.vercel.app/api/cron/update-nodes?network=devnet \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

2. **Check Logs**: Look for:
   - "Sample pod data" - verify structure
   - "Node ABC123: cpu=45.2, ram=..." - verify data extraction
   - "Network version: 0.7.3 (versions found: {...})" - verify version detection

3. **Check Database**:
```sql
SELECT 
  node_pubkey,
  cpu_percent,
  ram_used,
  ram_total,
  version,
  rpc_active
FROM snapshots 
WHERE created_at > NOW() - INTERVAL '5 minutes'
LIMIT 10;
```

Should see:
- ✅ `cpu_percent` with values (not null)
- ✅ `ram_used` with values (not null)
- ✅ `ram_total` with values
- ✅ `version` with actual versions
- ✅ `rpc_active` mix of true/false

4. **Check Frontend**: 
   - Refresh dashboard
   - CPU column should show percentages
   - RAM column should show percentages
   - Versions should be correct

## 🔄 If Still Not Working

If CPU/RAM still shows "-":

1. **Check RPC Response**: Look at server logs for "Sample pod data"
2. **Verify Field Names**: The RPC might use different field names
3. **Check Database**: Verify data is being saved correctly
4. **Check Time Window**: Frontend only shows data from last 15 minutes

Run this query:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(cpu_percent) as has_cpu,
  COUNT(ram_used) as has_ram,
  AVG(cpu_percent) as avg_cpu,
  AVG(ram_used) as avg_ram
FROM snapshots 
WHERE created_at > NOW() - INTERVAL '15 minutes';
```

Should show has_cpu and has_ram > 0.

## 📝 Files Modified

1. `src/lib/indexer.ts` - Fixed data normalization
2. Built-in debug logging for troubleshooting

All other files remain unchanged from previous fixes.
