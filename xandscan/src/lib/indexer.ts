import { supabase } from '@/lib/supabase';
import axios from 'axios';
import * as http from 'http';
import * as https from 'https';

// Optimize Axios with Keep-Alive agents
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });

const client = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 5000
});

const DEVNET_ENTRY_NODES = ["89.123.115.81"];
const MAINNET_ENTRY_NODES = [
  "161.97.97.41",
  "173.212.203.145",
  "173.212.220.65",
  "62.171.138.27",
  "173.212.207.32",
  "62.171.135.107",
  "173.249.3.118"
];
const CONCURRENCY_LIMIT = 50;

// Credits API URLs for different networks
const DEVNET_CREDITS_URL = 'https://podcredits.xandeum.network/api/pods-credits';
const MAINNET_CREDITS_URL = 'https://podcredits.xandeum.network/api/mainnet-pod-credits';

// RPC Response Interface matching Xandash/Network
interface PodWithStats {
  pubkey: string;
  id?: string; // Sometimes pubkey is returned as 'id'
  address?: string;
  ip?: string;
  port?: number;
  version?: string;
  status?: string;
  uptime?: number | string;
  cpu?: number; // Field name from RPC
  cpu_percent?: number;
  memory?: number; // Field name from RPC
  memory_used?: number;
  memory_total?: number;
  storage_committed?: number;
  storage_used?: number;
  is_public?: boolean;
  last_seen_timestamp?: number;
}

// Helper to normalize stats from various RPC formats
function normalizeNodeStats(node: any) {
  // The RPC returns 'cpu' and 'memory', not 'cpu_percent' and 'memory_used'
  // Xandash uses this same mapping
  const cpu = node.cpu ?? node.cpu_percent ?? 0;
  const memory = node.memory ?? node.memory_used ?? 0;
  const memoryTotal = node.memory_total ?? (memory > 0 ? memory * 1.5 : 8589934592); // Default 8GB if unknown
  
  return {
    cpu_percent: cpu,
    ram_used: memory,
    ram_total: memoryTotal,
    uptime: typeof node.uptime === 'string' ? parseFloat(node.uptime) : (node.uptime || 0),
    storage_used: node.storage_committed ?? node.storage_used ?? 0,
    version: node.version || 'Unknown',
    address: node.address || (node.ip ? `${node.ip}:${node.port || 6000}` : ''),
    pubkey: node.id || node.pubkey || '',
    status: node.status || 'unknown'
  };
}

async function getNodesWithStatsFromEntry(ip: string) {
  const port = 6000;
  try {
    console.log(`[INDEXER] Connecting to http://${ip}:${port}/rpc (get-pods-with-stats)...`);

    // Try get-pods-with-stats first (Rich Data)
    const res = await client.post(`http://${ip}:${port}/rpc`, {
      jsonrpc: "2.0",
      method: "get-pods-with-stats",
      id: 1
    }, { timeout: 8000 });

    if (res.status === 200 && res.data?.result?.pods) {
      console.log(`[INDEXER] Success! Retrieved ${res.data.result.pods.length} pods with stats.`);
      // Log first pod to see data structure
      if (res.data.result.pods.length > 0) {
        console.log(`[INDEXER] Sample pod data:`, JSON.stringify(res.data.result.pods[0], null, 2));
      }
      return res.data.result.pods;
    }
  } catch (e: any) {
    console.warn(`[INDEXER] Failed get-pods-with-stats from ${ip}: ${e.message}`);
  }

  // Fallback to simple get-pods if stats fails
  try {
    console.log(`[INDEXER] Fallback: Connecting to http://${ip}:${port}/rpc (get-pods)...`);
    const res = await client.post(`http://${ip}:${port}/rpc`, {
      jsonrpc: "2.0",
      method: "get-pods",
      id: 1
    }, { timeout: 5000 });

    if (res.status === 200 && res.data?.result?.pods) {
      console.log(`[INDEXER] Success! Retrieved ${res.data.result.pods.length} pods (basic).`);
      return res.data.result.pods;
    }
  } catch (e: any) {
    console.error(`[INDEXER] Failed get-pods from ${ip}: ${e.message}`);
  }

  return null;
}

async function getGeoData(ip: string) {
  try {
    // Use client with timeout
    const res = await client.get(`http://ip-api.com/json/${ip}`, { timeout: 3000 });
    if (res.status === 200) return res.data;
  } catch (e) {
    return null;
  }
  return null;
}

// Fetch individual node stats using get-stats RPC method
// This returns CPU, RAM, and other detailed metrics for a specific node
async function getNodeStats(ip: string, rpcPort: number = 6000) {
  try {
    const res = await client.post(`http://${ip}:${rpcPort}/rpc`, {
      jsonrpc: "2.0",
      method: "get-stats",
      id: 1,
      params: []
    }, { timeout: 3000 });

    if (res.status === 200 && res.data?.result) {
      const stats = res.data.result;
      return {
        cpu_percent: stats.cpu_percent ?? 0,
        ram_used: stats.ram_used ?? 0,
        ram_total: stats.ram_total ?? 0,
        uptime: stats.uptime ?? 0,
        active_streams: stats.active_streams ?? 0,
        packets_received: stats.packets_received ?? 0,
        packets_sent: stats.packets_sent ?? 0
      };
    }
  } catch (e: any) {
    // Silent fail - node might be offline or not exposing stats
    return null;
  }
  return null;
}

export async function updateNodes(network: 'mainnet' | 'devnet' = 'devnet') {
  try {
    console.log(`[INDEXER] Starting node discovery for ${network.toUpperCase()} via Bulk RPC...`);

    // 1. DISCOVERY & STATS: Select Enty Nodes based on Network
    const targetEntryNodes = network === 'devnet' ? DEVNET_ENTRY_NODES : MAINNET_ENTRY_NODES;

    let allNodes: any[] = [];
    for (const entryIp of targetEntryNodes) {
      const nodes = await getNodesWithStatsFromEntry(entryIp);
      if (nodes) {
        allNodes = nodes;
        break;
      }
    }

    if (allNodes.length === 0) {
      console.error('[INDEXER] No nodes found from any entry node');
      return { success: false, message: 'No nodes found' };
    }

    console.log(`[INDEXER] Total nodes discovered: ${allNodes.length}`);

    // 2. ENRICHMENT (Credits)
    console.log(`[INDEXER] Fetching credits data for ${network}...`);
    let creditsData: Record<string, number> = {};
    try {
      const creditsUrl = network === 'devnet' ? DEVNET_CREDITS_URL : MAINNET_CREDITS_URL;
      const creditsRes = await client.get(creditsUrl);

      // Check response structure - user said "DevNet pod credits" link shows list
      // Assuming standard structure { pods_credits: [...] }
      if (creditsRes.status === 200 && creditsRes.data?.pods_credits) {
        creditsData = creditsRes.data.pods_credits.reduce((acc: any, item: any) => {
          acc[item.pod_id] = item.credits;
          return acc;
        }, {});
      }
    } catch (e) {
      console.log(`[INDEXER] Failed to fetch credits data for ${network}`);
    }

    // Determine network version (most common version)
    const normalizedNodes = allNodes.map(normalizeNodeStats);
    const versions = normalizedNodes.map(n => n.version).filter(v => v && v !== 'Unknown');
    const versionCounts = versions.reduce((acc: any, v: string) => {
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});
    
    // Get the most common version
    const networkVersion = Object.keys(versionCounts).length > 0
      ? Object.keys(versionCounts).reduce((a, b) => (versionCounts[a] || 0) > (versionCounts[b] || 0) ? a : b, '')
      : 'Unknown';

    console.log(`[INDEXER] Network version: ${networkVersion} (versions found: ${JSON.stringify(versionCounts)})`);
    console.log(`[INDEXER] Processing nodes with concurrency: ${CONCURRENCY_LIMIT}`);

    let processedCount = 0;

    // Worker function for a single node
    const processNode = async (rawNode: any) => {
      const node = normalizeNodeStats(rawNode);
      const { pubkey, address, version, cpu_percent, ram_used, ram_total, uptime, storage_used } = node;

      const ip = address ? address.split(':')[0] : null;

      if (!ip || !pubkey) {
        console.warn(`[INDEXER] Skipping node with missing ip or pubkey`);
        return;
      }

      // Try to fetch detailed stats from individual node if IP is available
      let nodeStats = null;
      if (ip) {
        nodeStats = await getNodeStats(ip, rawNode.rpc_port || 6000);
        if (nodeStats) {
          // Override with actual stats from individual node RPC
          node.cpu_percent = nodeStats.cpu_percent;
          node.ram_used = nodeStats.ram_used;
          node.ram_total = nodeStats.ram_total;
          node.uptime = nodeStats.uptime;
        }
      }

      const { cpu_percent: finalCpu, ram_used: finalRam, ram_total: finalRamTotal, uptime: finalUptime } = node;

      // RPC is active if we got stats from individual node query OR from bulk data
      const rpc_active = nodeStats !== null || 
                         (finalCpu !== null && finalCpu !== undefined && finalCpu > 0) || 
                         (finalRam !== null && finalRam !== undefined && finalRam > 0) || 
                         (finalUptime !== null && finalUptime !== undefined && finalUptime > 0);
      
      // Debug log for first few nodes
      if (processedCount < 3) {
        console.log(`[INDEXER] Node ${pubkey.substring(0, 8)}: cpu=${finalCpu}, ram=${finalRam}/${finalRamTotal}, uptime=${finalUptime}, rpc_active=${rpc_active}${nodeStats ? ' (fetched)' : ' (from bulk)'}`);
      }

      // 2. Geo Data (Only if needed and safe)
      // Check DB first
      const { data: existingNode } = await supabase
        .from('nodes')
        .select('latitude, longitude, country, city, isp')
        .eq('pubkey', pubkey)
        .single();


      let geo = {
        lat: existingNode?.latitude || null,
        lon: existingNode?.longitude || null,
        country: existingNode?.country || 'Unknown',
        city: existingNode?.city || 'Unknown',
        isp: existingNode?.isp || null
      };

      // Only fetch Geo if missing AND RPC is active (to save API calls/time)
      // OR if we really want to try filling gaps. 
      // Python script: "Only fetch Geo for ACTIVE nodes"
      if (!geo.lat && rpc_active) {
        const geoData = await getGeoData(ip);
        if (geoData && geoData.status === 'success') {
          geo = {
            lat: geoData.lat,
            lon: geoData.lon,
            country: geoData.country,
            city: geoData.city,
            isp: geoData.isp
          };
        }
      }

      // 3. Prepare Data
      const credits = creditsData[pubkey] || 0;

      // 4. Scoring - use the final values from node stats
      let score = 0;
      const scoreCredits = Math.min(100, credits / 1000); // 30%
      const scoreVersion = version === networkVersion ? 100 : 50; // 20%

      if (rpc_active) {
        const scoreUptime = Math.min(100, (finalUptime || 0) / 3600); // 40%
        const scoreResources = 100 - (finalCpu || 0); // 10%
        score = (scoreUptime * 0.4) + (scoreCredits * 0.3) + (scoreVersion * 0.2) + (scoreResources * 0.1);
      } else {
        score = (0 * 0.4) + (scoreCredits * 0.3) + (scoreVersion * 0.2) + (0 * 0.1);
      }

      // 5. DB Upsert (Node)
      const nodeData: any = {
        pubkey,
        ip_address: ip,
        last_seen_at: new Date().toISOString(),
        is_active: true // We found it in gossip, so it's "active" in the network sense, even if RPC is down
      };

      if (geo.lat !== null) nodeData.latitude = geo.lat;
      if (geo.lon !== null) nodeData.longitude = geo.lon;
      if (geo.country) nodeData.country = geo.country;
      if (geo.city) nodeData.city = geo.city;
      if (geo.isp) nodeData.isp = geo.isp;

      await supabase.from('nodes').upsert(nodeData);

      // 6. DB Insert (Snapshot) - use final stats values
      const snapshotData = {
        node_pubkey: pubkey,
        version,
        credits,
        rpc_active,
        cpu_percent: finalCpu,
        ram_used: finalRam,
        ram_total: finalRamTotal,
        uptime_seconds: finalUptime,
        storage_used,
        total_score: score
      };
      
      // Debug first few inserts
      if (processedCount < 2) {
        console.log(`[INDEXER] Inserting snapshot for ${pubkey.substring(0, 8)}:`, JSON.stringify(snapshotData, null, 2));
      }
      
      await supabase.from('snapshots').insert(snapshotData);

      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`[INDEXER] Processed ${processedCount} nodes...`);
      }
    };

    // Run in parallel with concurrency limit
    const workers = new Set<Promise<void>>();
    for (const node of allNodes) {
      const worker = processNode(node).then(() => {
        workers.delete(worker);
      }).catch(err => {
        console.error(`[INDEXER] Error processing node ${node.pubkey}:`, err);
        workers.delete(worker);
      });

      workers.add(worker);

      if (workers.size >= CONCURRENCY_LIMIT) {
        await Promise.race(workers);
      }
    }

    await Promise.all(workers);

    console.log(`[INDEXER] Successfully processed ${processedCount} nodes`);
    return { success: true, processed: processedCount };
  } catch (error) {
    console.error('[INDEXER] Error:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}