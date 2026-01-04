// Server-side only RPC utilities
import https from 'https';
import http from 'http';

export interface RPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper function to make RPC call to a specific endpoint
async function makeRPCCall<T>(endpoint: string, method: string, params?: any): Promise<RPCResponse<T>> {
  return new Promise((resolve) => {
    try {
      const url = new URL(endpoint);
      const postData = JSON.stringify({
        jsonrpc: '2.0',
        method,
        params: params || {},
        id: Date.now(),
      });

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'XandScan/1.0',
        },
      };

      const requestModule = url.protocol === 'https:' ? https : http;
      
      const req = requestModule.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (result.error) {
              resolve({ 
                success: false, 
                error: result.error.message || 'RPC Error' 
              });
              return;
            }

            if (result.result !== undefined) {
              resolve({ success: true, data: result.result });
              return;
            }

            resolve({ success: false, error: 'No result in response' });
          } catch (parseError) {
            resolve({ 
              success: false, 
              error: 'Failed to parse JSON response' 
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ 
          success: false, 
          error: error.message 
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ 
          success: false, 
          error: 'Request timeout' 
        });
      });

      req.setTimeout(15000);
      req.write(postData);
      req.end();

    } catch (error) {
      resolve({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}

// RPC endpoints for different networks
const DEVNET_ENDPOINTS = [
  'http://89.123.115.81:6000/rpc',
];

const MAINNET_ENDPOINTS = [
  'http://161.97.97.41:6000/rpc',
  'http://173.212.203.145:6000/rpc',
  'http://173.212.220.65:6000/rpc',
  'http://62.171.138.27:6000/rpc',
  'http://173.212.207.32:6000/rpc',
  'http://62.171.135.107:6000/rpc',
  'http://173.249.3.118:6000/rpc',
];

// Direct RPC call function with failover logic and network support
export async function callDirectRPC<T>(
  method: string, 
  params?: any,
  network: 'mainnet' | 'devnet' = 'devnet'
): Promise<RPCResponse<T>> {
  const endpoints = network === 'devnet' ? DEVNET_ENDPOINTS : MAINNET_ENDPOINTS;
  
  // Try all endpoints
  for (const endpoint of endpoints) {
    const result = await makeRPCCall<T>(endpoint, method, params);
    if (result.success) {
      return result;
    }
  }
  
  return {
    success: false,
    error: `RPC call failed - all ${network} endpoints unavailable`
  };
}

// Server-side function to fetch network stats data
export async function getNetworkStatsData(network: 'mainnet' | 'devnet' = 'devnet') {
  try {
    const response = await callDirectRPC('get-stats', {}, network);
    
    if (!response.success || !response.data) {
      return {
        stats: null,
        error: response.error || 'Failed to fetch network stats'
      };
    }

    const statsData = response.data as any;
    
    // Process and normalize the stats data
    const processedStats = {
      active_streams: statsData.active_streams || 0,
      cpu_percent: statsData.cpu_percent || 0,
      current_index: statsData.current_index || 0,
      file_size: statsData.file_size || 0,
      last_updated: statsData.last_updated || Date.now(),
      packets_received: statsData.packets_received || 0,
      packets_sent: statsData.packets_sent || 0,
      ram_total: statsData.ram_total || 8589934592, // Default 8GB
      ram_used: statsData.ram_used || 0,
      total_bytes: statsData.total_bytes || 0,
      total_pages: statsData.total_pages || 0,
      uptime: statsData.uptime || 0,
    };

    return {
      stats: processedStats
    };
  } catch (error) {
    console.error('Server-side network stats fetch error:', error);
    return {
      stats: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Server-side function to fetch version data
export async function getVersionData(network: 'mainnet' | 'devnet' = 'devnet') {
  try {
    const response = await callDirectRPC('get-version', {}, network);
    
    if (!response.success || !response.data) {
      return {
        version: null,
        error: response.error || 'Failed to fetch version'
      };
    }

    const versionData = response.data as any;
    
    return {
      version: {
        version: versionData.version || '0.7.3',
        build: versionData.build,
        commit: versionData.commit,
      }
    };
  } catch (error) {
    console.error('Server-side version fetch error:', error);
    return {
      version: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
