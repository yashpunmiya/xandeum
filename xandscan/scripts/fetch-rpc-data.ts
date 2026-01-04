
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const IP = "161.97.97.41";
const PORT = 6000;

async function fetchAndSave() {
    const url = `http://${IP}:${PORT}/rpc`;
    console.log(`Fetching from ${url}...`);

    try {
        const res = await axios.post(url, {
            jsonrpc: "2.0",
            method: "get-pods-with-stats",
            id: 1
        }, { timeout: 10000 });

        if (res.data?.result?.pods) {
            const pods = res.data.result.pods;
            console.log(`Success: Found ${pods.length} pods.`);

            const outputPath = path.join(__dirname, '..', 'rpc-output.json');
            fs.writeFileSync(outputPath, JSON.stringify(pods.slice(0, 3), null, 2));
            console.log(`Saved sample data to ${outputPath}`);
        } else {
            console.log("No pods found in result.");
            console.log(JSON.stringify(res.data));
        }
    } catch (e: any) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Response:", e.response.data);
        }
    }
}

fetchAndSave();
