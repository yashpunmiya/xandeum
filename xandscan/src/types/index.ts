export interface Node {
  pubkey: string;
  ip_address: string;
  gossip_port: number;
  rpc_port: number;
  country: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isp: string;
  first_seen_at: string;
  last_seen_at: string;
  is_active: boolean;
  stats?: Partial<Snapshot>;
}

export interface Snapshot {
  id?: number;
  node_pubkey: string;
  created_at?: string;
  version: string | null;
  credits: number;
  rpc_active: boolean;
  cpu_percent: number | null;
  ram_used: number | null;
  ram_total: number | null;
  uptime_seconds: number | null;
  storage_used: number | null;
  storage_total?: number | null;
  total_score: number;
}

export interface PodCreditsResponse {
  [pubkey: string]: number;
}

export interface GeoResponse {
  status: string;
  country: string;
  city: string;
  lat: number;
  lon: number;
  isp: string;
}

export interface RpcStatsResponse {
  cpu_percent: number;
  ram_used: number;
  ram_total: number;
  uptime_seconds: number;
  storage_used: number;
  version: string;
}
