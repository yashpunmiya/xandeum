import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Create mock nodes
    const mockNodes = [
      { pubkey: 'node1abc123', ip_address: '192.168.1.100', country: 'United States', city: 'New York', latitude: 40.7128, longitude: -74.0060, isp: 'AWS' },
      { pubkey: 'node2def456', ip_address: '10.0.0.50', country: 'Germany', city: 'Berlin', latitude: 52.5200, longitude: 13.4050, isp: 'Digital Ocean' },
      { pubkey: 'node3ghi789', ip_address: '172.16.0.25', country: 'Japan', city: 'Tokyo', latitude: 35.6762, longitude: 139.6503, isp: 'Google Cloud' },
      { pubkey: 'node4jkl012', ip_address: '192.168.2.75', country: 'United Kingdom', city: 'London', latitude: 51.5074, longitude: -0.1278, isp: 'Azure' },
      { pubkey: 'node5mno345', ip_address: '10.10.10.10', country: 'France', city: 'Paris', latitude: 48.8566, longitude: 2.3522, isp: 'OVH' },
    ];

    for (const node of mockNodes) {
      await supabase.from('nodes').upsert(node);
    }

    // Create mock snapshots
    const mockSnapshots = mockNodes.map((node, index) => ({
      node_pubkey: node.pubkey,
      version: '1.0.0',
      credits: Math.floor(Math.random() * 5000),
      rpc_active: index % 2 === 0, // Alternate between active and inactive
      cpu_percent: Math.random() * 100,
      ram_used: Math.floor(Math.random() * 16 * 1024 * 1024 * 1024),
      ram_total: 16 * 1024 * 1024 * 1024,
      uptime_seconds: Math.floor(Math.random() * 86400),
      storage_used: Math.floor(Math.random() * 500 * 1024 * 1024 * 1024),
      total_score: 50 + Math.random() * 50
    }));

    for (const snapshot of mockSnapshots) {
      await supabase.from('snapshots').insert(snapshot);
    }

    return NextResponse.json({ success: true, message: 'Mock data created', nodes: mockNodes.length });
  } catch (error) {
    console.error('Mock data error:', error);
    return NextResponse.json({ error: 'Failed to create mock data' }, { status: 500 });
  }
}
