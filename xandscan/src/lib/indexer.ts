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

const ENTRY_NODES = ["192.190.136.28", "192.190.136.36", "192.190.136.37", "192.190.136.38"];
const CONCURRENCY_LIMIT = 50;

async function getPodsFromEntryNode(ip: string) {
  const port = 6000;
  try {
    console.log(`[INDEXER] Connecting to http://${ip}:${port}/rpc...`);
    
    const res = await client.post(`http://${ip}:${port}/rpc`, {
      jsonrpc: "2.0", 
      method: "get-pods", 
      id: 1 
    });
    
    if (res.status === 200) {
      const data = res.data;
      if (data.result && data.result.pods) {
        console.log(`[INDEXER] Success! Found ${data.result.pods.length} pods.`);
        return data.result.pods;
      }
    }
  } catch (e: any) {
    // console.log(`[INDEXER] Connection failed to ${ip}: ${e.message}`);
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

async function getRpcStats(ip: string, gossipPort: number) {
  const ports = [6000, gossipPort];
  // Filter out duplicates if gossipPort is 6000
  const uniquePorts = [...new Set(ports)];
  
  for (const port of uniquePorts) {
    try {
      const res = await client.post(`http://${ip}:${port}/rpc`, {
        jsonrpc: "2.0", 
        method: "get-stats", 
        id: 1 
      }, {
        timeout: 3000
      });

      if (res.status === 200) {
        const data = res.data;
        if (data.result) return data.result;
      }
    } catch (e) {
      // Continue
    }
  }
  return null;
}

export async function updateNodes() {
  try {
    console.log('[INDEXER] Starting node discovery...');
    
    // 1. DISCOVERY
    let allNodes: any[] = [];
    for (const entryIp of ENTRY_NODES) {
      const nodes = await getPodsFromEntryNode(entryIp);
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
    console.log('[INDEXER] Fetching credits data...');
    let creditsData: Record<string, number> = {};
    try {
      const creditsRes = await client.get('https://podcredits.xandeum.network/api/pods-credits');
      if (creditsRes.status === 200 && creditsRes.data?.pods_credits) {
        creditsData = creditsRes.data.pods_credits.reduce((acc: any, item: any) => {
          acc[item.pod_id] = item.credits;
          return acc;
        }, {});
      }
    } catch (e) {
      console.log('[INDEXER] Failed to fetch credits data');
    }

    // Determine network version
    const versions = allNodes.map(n => n.version).filter(Boolean);
    const versionCounts = versions.reduce((acc: any, v: string) => {
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});
    const networkVersion = Object.keys(versionCounts).reduce((a, b) => (versionCounts[a] || 0) > (versionCounts[b] || 0) ? a : b, '');

    console.log(`[INDEXER] Network version: ${networkVersion}`);
    console.log(`[INDEXER] Processing nodes with concurrency: ${CONCURRENCY_LIMIT}`);

    let processedCount = 0;

    // Worker function for a single node
    const processNode = async (node: any) => {
      const { pubkey, address, version } = node;
      const ip = address ? address.split(':')[0] : null;
      const gossipPort = address && address.includes(':') ? parseInt(address.split(':')[1]) : 6000;
      
      if (!ip || !pubkey) return;

      // 1. Get RPC Stats FIRST (Parallelizable)
      const stats = await getRpcStats(ip, gossipPort);
      const rpc_active = !!stats;
      
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
      
      let cpu_percent = null;
      let ram_used = null;
      let ram_total = null;
      let uptime_seconds = null;
      let storage_used = null;

      if (stats) {
        cpu_percent = stats.cpu_percent;
        ram_used = stats.ram_used;
        ram_total = stats.ram_total;
        uptime_seconds = stats.uptime;
        storage_used = stats.file_size;
      }

      // 4. Scoring
      let score = 0;
      const scoreCredits = Math.min(100, credits / 1000); // 30%
      const scoreVersion = version === networkVersion ? 100 : 50; // 20%
      
      if (rpc_active) {
        const scoreUptime = Math.min(100, (uptime_seconds || 0) / 3600); // 40%
        const scoreResources = 100 - (cpu_percent || 0); // 10%
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

      // 6. DB Insert (Snapshot)
      await supabase.from('snapshots').insert({
        node_pubkey: pubkey,
        version,
        credits,
        rpc_active,
        cpu_percent,
        ram_used,
        ram_total,
        uptime_seconds,
        storage_used,
        total_score: score
      });

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