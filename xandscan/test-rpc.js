// Quick test to see raw RPC response
const RPC_ENDPOINTS = {
  devnet: ['http://89.123.115.81:6000/rpc'],
  mainnet: [
    'http://161.97.97.41:6000/rpc',
    'http://188.245.107.51:6000/rpc',
    'http://176.9.88.212:6000/rpc'
  ]
};

async function testRPC(network = 'devnet') {
  console.log(`\n=== Testing ${network.toUpperCase()} RPC ===\n`);
  
  const endpoints = RPC_ENDPOINTS[network];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Calling: ${endpoint}`);
      console.log(`Method: get-pods-with-stats`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'get-pods-with-stats',
          params: []
        })
      });
      
      if (!response.ok) {
        console.error(`❌ HTTP ${response.status}: ${response.statusText}\n`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data.result) {
        console.error('❌ No result in response:', data);
        continue;
      }
      
      const pods = data.result.pods || data.result;
      
      if (!Array.isArray(pods) || pods.length === 0) {
        console.error('❌ No pods in response');
        continue;
      }
      
      console.log(`✅ Success! Got ${pods.length} pods\n`);
      console.log('=== First Pod ===');
      console.log(JSON.stringify(pods[0], null, 2));
      
      console.log('\n=== Fields Present ===');
      const fields = Object.keys(pods[0]);
      console.log(fields.sort().join(', '));
      
      console.log('\n=== CPU/RAM Check ===');
      console.log(`Has 'cpu' field: ${fields.includes('cpu')}`);
      console.log(`Has 'cpu_percent' field: ${fields.includes('cpu_percent')}`);
      console.log(`Has 'memory' field: ${fields.includes('memory')}`);
      console.log(`Has 'memory_used' field: ${fields.includes('memory_used')}`);
      console.log(`Has 'ram_used' field: ${fields.includes('ram_used')}`);
      console.log(`Has 'ram_total' field: ${fields.includes('ram_total')}`);
      
      if (fields.includes('cpu')) {
        console.log(`\nCPU value: ${pods[0].cpu}`);
      }
      if (fields.includes('memory')) {
        console.log(`Memory value: ${pods[0].memory}`);
      }
      
      break; // Success, no need to try other endpoints
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }
}

// Test both networks
async function main() {
  await testRPC('devnet');
  console.log('\n' + '='.repeat(60) + '\n');
  await testRPC('mainnet');
}

main().catch(console.error);
