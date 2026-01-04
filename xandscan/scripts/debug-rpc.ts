
import axios from 'axios';

const ENTRY_NODES = ["161.97.97.41", "192.190.136.28", "192.190.136.36"];

async function testRPC() {
    console.log("=== STARTING RPC DIAGNOSTIC ===");

    for (const ip of ENTRY_NODES) {
        console.log(`\nTesting IP: ${ip}`);
        const url = `http://${ip}:6000/rpc`;

        try {
            console.log(`Sending 'get-pods-with-stats' to ${url}...`);
            const start = Date.now();
            const res = await axios.post(url, {
                jsonrpc: "2.0",
                method: "get-pods-with-stats",
                id: 1
            }, { timeout: 5000 });

            console.log(`Status: ${res.status} (${Date.now() - start}ms)`);

            if (res.data?.result?.pods) {
                const pods = res.data.result.pods;
                console.log(`SUCCESS! Found ${pods.length} pods.`);
                if (pods.length > 0) {
                    console.log("Sample Pod Data (First Item):");
                    console.log(JSON.stringify(pods[0], null, 2));
                }
            } else {
                console.log("Response OK but no pods/result found:", JSON.stringify(res.data).slice(0, 200));
            }
        } catch (e: any) {
            console.error(`FAILED: ${e.message}`);
            if (e.response) {
                console.log(`Response Data: ${JSON.stringify(e.response.data)}`);
            }
        }

        // Also try basic 'get-pods'
        try {
            console.log(`Sending 'get-pods' to ${url}...`);
            const res = await axios.post(url, {
                jsonrpc: "2.0",
                method: "get-pods",
                id: 1
            }, { timeout: 5000 });
            if (res.data?.result?.pods) {
                console.log(`SUCCESS ('get-pods')! Found ${res.data.result.pods.length} pods.`);
            }
        } catch (e: any) {
            console.error(`FAILED ('get-pods'): ${e.message}`);
        }
    }
}

testRPC();
