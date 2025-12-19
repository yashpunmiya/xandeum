# =============================================================================
# XANDEUM PNODE INDEXER - FINAL COLAB VERSION
# =============================================================================
# 1. Installs dependencies automatically.
# 2. Fetches Pods, Credits, Stats, and Location (Geo).
# 3. Exports 'pnodes.json' (for your frontend) and 'pnodes.csv' (for Excel).
# =============================================================================

!pip install requests pandas numpy tqdm

import requests
import pandas as pd
import numpy as np
import json
import time
import concurrent.futures
from datetime import datetime, timezone
from collections import Counter
from tqdm import tqdm  # Professional progress bar

# --- CONFIGURATION ---
DEFAULT_RPC_PORT = 6000  # The standard Xandeum RPC port
MAX_WORKERS = 50         # Threads for parallel processing (Fast!)

class XandeumIndexer:
    def __init__(self):
        # Known entry points to the network
        self.entry_nodes = [
            "192.190.136.28", "192.190.136.36",
            "192.190.136.37", "192.190.136.38"
        ]
        self.session = requests.Session()
        self.pods = []
        self.credits_map = {}
        self.latest_version = None

    def _normalize_version(self, version_str):
        """Cleans version string (e.g., '0.8.0-trynet...' -> '0.8.0')"""
        if not version_str: return "unknown"
        return version_str.split('-')[0]

    def get_pods_from_gossip(self):
        """Step 1: Discover nodes via Gossip Protocol"""
        print(f"📡 Connecting to Xandeum Network...")
        payload = {"jsonrpc": "2.0", "method": "get-pods", "id": 1}

        for host in self.entry_nodes:
            try:
                # Try standard port 6000 first for discovery
                url = f"http://{host}:{DEFAULT_RPC_PORT}/rpc"
                resp = self.session.post(url, json=payload, timeout=5)
                resp.raise_for_status()
                data = resp.json()

                if "result" in data and "pods" in data["result"]:
                    raw_pods = data["result"]["pods"]
                    print(f"✅ Connected via {host}! Discovered {len(raw_pods)} nodes.")

                    self.pods = []
                    for p in raw_pods:
                        # Extract IP and Gossip Port from address (e.g., "1.2.3.4:9001")
                        address = p.get("address", "")
                        ip = address.split(":")[0] if address else ""
                        gossip_port = address.split(":")[1] if ":" in address else str(DEFAULT_RPC_PORT)

                        self.pods.append({
                            "pubkey": p.get("pubkey"),
                            "address": address,
                            "ip": ip,
                            "gossip_port": gossip_port,
                            "version": self._normalize_version(p.get("version")),
                            "last_seen_ts": p.get("last_seen_timestamp", 0)
                        })
                    return True
            except Exception:
                continue

        print("❌ Could not connect to any entry node. Network might be down or unreachable.")
        return False

    def get_credits(self):
        """Step 2: Fetch Credit Scores from External API"""
        print("💰 Fetching Credits...")
        try:
            url = "https://podcredits.xandeum.network/api/pods-credits"
            resp = self.session.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                # Create a lookup map: pod_id -> credits
                self.credits_map = {item["pod_id"]: item.get("credits", 0) for item in data.get("pods_credits", [])}
                print(f"✅ Loaded credits for {len(self.credits_map)} nodes.")
            else:
                print("⚠️ Credits API returned error. Proceeding without credits.")
        except Exception as e:
            print(f"⚠️ Failed to fetch credits: {e}")

    def fetch_node_details(self, pod):
        """Worker Function: Fetches Stats & Geo for ONE node"""
        ip = pod['ip']
        stats = {}
        geo = {}
        rpc_active = False

        # --- A. Try Fetching Stats (RPC) ---
        # Strategy: Try Port 6000 first. If fail, try Gossip Port.
        ports_to_try = [DEFAULT_RPC_PORT]
        if pod['gossip_port'] and pod['gossip_port'] != str(DEFAULT_RPC_PORT):
            ports_to_try.append(pod['gossip_port'])

        for port in ports_to_try:
            try:
                rpc_url = f"http://{ip}:{port}/rpc"
                payload = {"jsonrpc": "2.0", "method": "get-stats", "id": 1}
                resp = self.session.post(rpc_url, json=payload, timeout=2) # Short timeout for speed
                if resp.status_code == 200:
                    data = resp.json()
                    if "result" in data:
                        stats = data["result"]
                        rpc_active = True
                        break # Success! Stop trying ports.
            except:
                continue

        # --- B. Fetch Geo-Location ---
        # CRITICAL OPTIMIZATION: Only fetch Geo for ACTIVE nodes to avoid Rate Limits.
        # (Free API limit is ~45/min. Active nodes are usually ~35. Perfect fit.)
        if rpc_active:
            try:
                geo_url = f"http://ip-api.com/json/{ip}?fields=country,city,lat,lon,isp"
                resp = self.session.get(geo_url, timeout=2)
                if resp.status_code == 200:
                    geo = resp.json()
                    # Sleep tiny bit to be nice to the API
                    time.sleep(0.1)
            except:
                pass

        # Return combined data
        return {
            **pod,
            "cpu_percent": stats.get("cpu_percent"),
            "ram_used": stats.get("ram_used"),
            "ram_total": stats.get("ram_total"),
            "uptime_seconds": stats.get("uptime"),
            "active_streams": stats.get("active_streams"),
            "storage_used": stats.get("file_size"),
            "rpc_active": rpc_active,
            "credits": self.credits_map.get(pod["pubkey"], 0),
            "country": geo.get("country", "Unknown"),
            "city": geo.get("city", "Unknown"),
            "lat": geo.get("lat"),
            "lon": geo.get("lon"),
            "isp": geo.get("isp")
        }

    def enrich_data(self):
        """Step 3: Run the Worker Function in Parallel"""
        print(f"🚀 Enriching {len(self.pods)} nodes (Parallel)...")

        enriched_pods = []
        # ThreadPoolExecutor runs multiple requests at the same time
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # tqdm creates the progress bar
            results = list(tqdm(executor.map(self.fetch_node_details, self.pods), total=len(self.pods)))
            enriched_pods = results

        self.pods = enriched_pods

    def calculate_scores(self):
        """Step 4: Smart Scoring Algorithm"""
        print("📊 Calculating Scores...")

        # 1. Auto-detect the "Standard" Version
        versions = [p['version'] for p in self.pods if p['version'] != 'unknown']
        if versions:
            self.latest_version = Counter(versions).most_common(1)[0][0]
            print(f"ℹ️  Network Standard Version detected: {self.latest_version}")
        else:
            self.latest_version = "0.0.0"

        for pod in self.pods:
            # defaults
            cpu_score = 0
            uptime_score = 0
            ver_score = 0
            cred_score = 0

            # A. Stats Score (Only if RPC worked)
            if pod['rpc_active']:
                # CPU: Lower is better. 0% usage = 100 score. 100% usage = 0 score.
                cpu_score = max(0, 100 - (pod['cpu_percent'] or 0))
                # Uptime: Higher is better. Cap at 100 hours for max score.
                uptime_hours = (pod['uptime_seconds'] or 0) / 3600
                uptime_score = min(100, uptime_hours)

            # B. Version Score
            if pod['version'] == self.latest_version:
                ver_score = 100  # Perfect match
            elif pod['version'] != 'unknown':
                ver_score = 50   # Old version

            # C. Credits Score
            # Example: 10,000 credits = 100 score. Cap at 100.
            cred_score = min(100, (pod['credits'] / 100.0))

            # D. Weighted Total
            # Weights: Reliability (40%), Credits (30%), Version (20%), Resources (10%)
            total = (
                (0.4 * uptime_score) +
                (0.3 * cred_score) +
                (0.2 * ver_score) +
                (0.1 * cpu_score)
            )
            pod['total_score'] = round(total, 2)

    def export(self):
        """Step 5: Export Data"""
        df = pd.DataFrame(self.pods)

        # Sort by Score (High to Low)
        df = df.sort_values('total_score', ascending=False)
        df.insert(0, 'rank', range(1, len(df) + 1))

        # Save JSON (Best for Website/Frontend)
        df.to_json('pnodes.json', orient='records', indent=2)
        print("✅ Saved 'pnodes.json' (Download this for your frontend!)")

        # Save CSV (Best for Excel/Checking)
        df.to_csv('pnodes.csv', index=False)
        print("✅ Saved 'pnodes.csv'")

        return df

# =============================================================================
# MAIN EXECUTION
# =============================================================================

indexer = XandeumIndexer()

# 1. Get Nodes
if indexer.get_pods_from_gossip():

    # 2. Get Credits
    indexer.get_credits()

    # 3. Get Stats & Geo (Parallel)
    indexer.enrich_data()

    # 4. Calculate Scores
    indexer.calculate_scores()

    # 5. Export
    final_df = indexer.export()

    # Show Top 10 Active Nodes
    print("\n🏆 TOP 10 XANDEUM NODES")
    cols = ['rank', 'ip', 'country', 'version', 'credits', 'rpc_active', 'total_score']
    print(final_df[cols].head(10).to_string(index=False))

else:
    print("❌ Failed to initialize. Check network connection.")