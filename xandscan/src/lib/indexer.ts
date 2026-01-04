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

    // 2. ENRICHMENT (Credits & Country Stats)
    // 2. ENRICHMENT (Credits & Country Stats)
    console.log(`[INDEXER] Fetching credits data (Both Networks)...`);
    let creditsData: Record<string, number> = {};

    try {
      // Fetch both in parallel
      const [devnetRes, mainnetRes] = await Promise.allSettled([
        client.get(DEVNET_CREDITS_URL),
        client.get(MAINNET_CREDITS_URL)
      ]);

      const processCredits = (res: any) => {
        if (res.status === 'fulfilled' && res.value?.status === 200 && res.value?.data?.pods_credits) {
          return res.value.data.pods_credits;
        }
        return [];
      };

      const devnetCredits = processCredits(devnetRes);
      const mainnetCredits = processCredits(mainnetRes);

      const allCreditsRaw = [...devnetCredits, ...mainnetCredits];

      // Merge: if duplicate, simple overwrite or max logic (though IDs should be unique per network ideally)
      creditsData = allCreditsRaw.reduce((acc: any, item: any) => {
        const existing = acc[item.pod_id] || 0;
        // Take the larger value if duplicates exist
        acc[item.pod_id] = Math.max(existing, item.credits || 0);
        return acc;
      }, {});

      console.log(`[INDEXER] Credits loaded. Devnet: ${devnetCredits.length}, Mainnet: ${mainnetCredits.length}`);

    } catch (e) {
      console.log(`[INDEXER] Failed to fetch credits data:`, e);
    }

    // Fetch existing country distribution for Decentralization Score
    const { data: dbNodes } = await supabase.from('nodes').select('country');
    const countryCounts: Record<string, number> = {};
    let totalNodesWithCountry = 0;
    dbNodes?.forEach(n => {
      if (n.country && n.country !== 'Unknown') {
        countryCounts[n.country] = (countryCounts[n.country] || 0) + 1;
        totalNodesWithCountry++;
      }
    });

    // Version Logic helper
    const getVersionScore = (v: string) => {
      if (!v || v === 'Unknown') return 0;
      // Extract Major.Minor
      const parts = v.split('.').map(Number);
      if (parts.length < 2) return 0;
      const [major, minor] = parts;

      if (major >= 1) return 100; // v1.0.0+
      if (major === 0) {
        if (minor >= 7) return 100; // v0.7.x, v0.8.x
        if (minor === 6) return 20; // v0.6.x (outdated)
      }
      return 0; // Older
    };

    // Determine network version
    const normalizedNodes = allNodes.map(normalizeNodeStats);
    const versions = normalizedNodes.map(n => n.version).filter(v => v && v !== 'Unknown');
    const versionCounts = versions.reduce((acc: any, v: string) => {
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});
    const networkVersion = Object.keys(versionCounts).reduce((a, b) => (versionCounts[a] || 0) > (versionCounts[b] || 0) ? a : b, '');

    console.log(`[INDEXER] Network version: ${networkVersion}`);
    console.log(`[INDEXER] Processing nodes with concurrency: ${CONCURRENCY_LIMIT}`);

    let processedCount = 0;

    // Worker function for a single node
    const processNode = async (rawNode: any) => {
      const node = normalizeNodeStats(rawNode);
      const { pubkey, address, version } = node;
      const ip = address ? address.split(':')[0] : null;

      if (!ip || !pubkey) return;

      // 1. Get Details (Simulated from Bulk or Individual)
      // Already normalized
      let { cpu_percent, ram_used, ram_total, uptime, storage_used } = node;

      // Fetch individual stats (CPU, RAM) if IP is available
      if (ip) {
        const stats = await getNodeStats(ip);
        if (stats) {
          cpu_percent = stats.cpu_percent;
          ram_used = stats.ram_used;
          ram_total = stats.ram_total;
          uptime = stats.uptime;
        }
      }

      const rpc_active = uptime > 0 || (cpu_percent && cpu_percent > 0);

      // 2. Geo Data
      const { data: existingNode } = await supabase.from('nodes').select('latitude, longitude, country, city, isp').eq('pubkey', pubkey).single();

      let geo = {
        country: existingNode?.country || 'Unknown',
        lat: existingNode?.latitude || null,
        lon: existingNode?.longitude || null,
        city: existingNode?.city || 'Unknown',
        isp: existingNode?.isp || null
      };

      if (!geo.lat && rpc_active) {
        const geoData = await getGeoData(ip);
        if (geoData?.status === 'success') {
          geo = {
            country: geoData.country,
            lat: geoData.lat,
            lon: geoData.lon,
            city: geoData.city,
            isp: geoData.isp
          };
        }
      }

      // 3. Prepare Data
      const credits = creditsData[pubkey] || 0;

      // 4. SCORING ALGORITHM

      // A. Reliability Score (Uptime)
      // Target: 7 days (604800 seconds)
      const uptimeDays = (uptime || 0) / 86400.0;
      let s_reliability = 0;
      if (uptimeDays >= 7.0) {
        s_reliability = 100.0;
      } else {
        s_reliability = (uptimeDays / 7.0) * 100.0;
      }
      // Fallback: If node hides stats (no valid uptime) but was seen via gossip (rpc_active flag or just existence here)
      // We assume if uptime is 0 but we are processing it, it might be hiding stats.
      // However, we only give 20 points if it's "active". 
      // rpc_active is derived from (uptime > 0 || cpu > 0). If it hides stats, stats are null/0.
      // So checking !rpc_active (or very low uptime) but it's in our list.
      // The user specified: "If node hides stats but was seen... gets 20"
      if (s_reliability === 0) {
        s_reliability = 20.0;
      }

      // B. Performance Score (RAM + Storage)
      // Divisor: 1_000_000_000.0 (10^9) as per Rust spec
      const GB_DIVISOR = 1_000_000_000.0;

      // RAM Target: 64GB
      const ram_gb = (ram_total || 0) / GB_DIVISOR;
      let ram_score = 0;
      if (ram_gb >= 64.0) {
        ram_score = 100.0;
      } else if (ram_gb <= 8.0) {
        ram_score = 0.0;
      } else {
        ram_score = (ram_gb / 64.0) * 100.0;
      }

      // Storage Target: 1000GB (1TB)
      const storage_gb = (storage_used || 0) / GB_DIVISOR;
      let storage_score = 0;
      if (storage_gb >= 1000.0) {
        storage_score = 100.0;
      } else {
        storage_score = (storage_gb / 1000.0) * 100.0;
      }

      const s_performance = (ram_score * 0.5) + (storage_score * 0.5);

      // C. Decentralization Score (Geographic)
      let s_decentralization = 100.0;
      if (geo.country && geo.country !== 'Unknown' && totalNodesWithCountry > 0) {
        const count = countryCounts[geo.country] || 0;
        const concentration = count / totalNodesWithCountry;

        if (concentration < 0.10) s_decentralization = 100.0;
        else if (concentration < 0.30) s_decentralization = 50.0;
        else s_decentralization = 0.0;
      }

      // D. Version Score
      const s_version = getVersionScore(version);

      // TOTAL SCORE (Average)
      const score = (s_reliability + s_performance + s_decentralization + s_version) / 4;

      // 5. DB Upsert


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
        cpu_percent: cpu_percent,
        ram_used: ram_used,
        ram_total: ram_total,
        uptime_seconds: uptime,
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