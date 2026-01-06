import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { response: "I'm ready to help! However, the 'GEMINI_API_KEY' is missing in the system configuration. Please ask the developer to add it to the .env.local file to enable my intelligence." },
                { status: 200 } // Return 200 to show message in chat interface
            );
        }

        // 1. Fetch Comprehensive Real-time Data
        // Fetch separate data streams for full context
        const [snapshotsRes, nodesRes] = await Promise.all([
            supabase.from('snapshots').select('*').order('created_at', { ascending: false }).limit(1000),
            supabase.from('nodes').select('*')
        ]);

        const snapshots = snapshotsRes.data || [];
        const nodes = nodesRes.data || [];

        // Map latest snapshot to each node to create current state
        const uniqueActiveNodes = new Map();
        snapshots.forEach(s => {
            if (!uniqueActiveNodes.has(s.node_pubkey)) {
                uniqueActiveNodes.set(s.node_pubkey, s);
            }
        });

        // Combine Node Metadata with Live Stats
        const activeNodeList = nodes
            .filter(n => uniqueActiveNodes.has(n.pubkey))
            .map(n => {
                const stats = uniqueActiveNodes.get(n.pubkey);
                return {
                    pubkey: n.pubkey,
                    country: n.country || 'Unknown',
                    city: n.city || 'Unknown',
                    version: stats.version,
                    score: stats.total_score || 0,
                    storage: stats.storage_used || 0,
                    cpu: stats.cpu_percent || 0,
                    uptime: stats.uptime_seconds || 0
                };
            })
            .sort((a, b) => b.score - a.score); // Sort by score descending

        // Aggregations
        const totalStorage = activeNodeList.reduce((acc, n) => acc + n.storage, 0);
        const avgScore = activeNodeList.reduce((acc, n) => acc + n.score, 0) / (activeNodeList.length || 1);

        // Distribution Helpers
        const getDistribution = (arr: any[], key: string) => {
            const dist: Record<string, number> = {};
            arr.forEach(item => {
                const val = item[key] || 'Unknown';
                dist[val] = (dist[val] || 0) + 1;
            });
            return dist;
        };

        const contextData = {
            networkOverview: {
                status: 'Online',
                totalActiveNodes: activeNodeList.length,
                totalStorageFormatted: (totalStorage / (1024 * 1024 * 1024 * 1024)).toFixed(2) + ' TB',
                averageNodeScore: avgScore.toFixed(1),
                timestamp: new Date().toISOString()
            },
            distributions: {
                versions: getDistribution(activeNodeList, 'version'),
                countries: getDistribution(activeNodeList, 'country')
            },
            topPerformers: activeNodeList.slice(0, 20).map(n => ({
                id: n.pubkey, // Full ID for better context
                score: n.score.toFixed(0),
                location: `${n.city}, ${n.country}`,
                version: n.version,
                storage: (n.storage / (1024 * 1024 * 1024)).toFixed(0) + ' GB'
            }))
        };

        // 2. Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Reverting to stable flash model

        // 3. Construct Prompt
        const systemPrompt = `
      You are XandAI, the highly intelligent network operations assistant for Xandeum.
      
      Your Goal: Provide precise, data-backed insights about the Xandeum network using the REAL-TIME DATA provided below.
      
      === LIVE NETWORK DATA ===
      ${JSON.stringify(contextData, null, 2)}
      =========================
      
      Guidelines:
      1. **Be Specific**: When asked "How is the network?", quote the Total Active Nodes and Total Storage immediately.
      2. **Top Nodes**: If asked for "best nodes" or "top performers", list 3-5 from the 'topPerformers' list with their specific scores and locations.
      3. **Versions**: If asked about updates, reference the 'versions' distribution.
      4. **Storage**: Always convert raw bytes to meaningful units (TB/PB) if not already done.
      5. **Honesty**: If a specific node ID is asked for that is NOT in the 'topPerformers' list, explain that you only have detailed stats for the top 20 visible nodes in your immediate context, but can provide general network stats.
      6. **Tone**: Professional, technical, yet accessible. High-tech "Network Operator" persona.
      
      Formatting:
      - Use **bold** for metrics.
      - Use Tables for lists of nodes.
      - Use bullet points for feature summaries.
    `;

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: 'model',
                    parts: [{ text: "Understood. I am ready to assist with Xandscan data." }],
                },
                ...history,
            ],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ response: text });

    } catch (error: any) {
        console.error('Chat Error:', error);
        return NextResponse.json(
            { response: "I encountered a temporary error connecting to the neural network. Please try again in a moment." },
            { status: 500 }
        );
    }
}
