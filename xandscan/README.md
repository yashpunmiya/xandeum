# XandScan - Xandeum Network Explorer

Advanced network intelligence and node explorer for the Xandeum decentralized network. Monitor nodes, track performance metrics, and visualize network distribution in real-time.

## 🚀 Features

- **Multi-Network Support**: Switch between Mainnet and Devnet seamlessly
- **Real-Time Monitoring**: Live stats for nodes, RPC status, and network metrics
- **Advanced Node Analytics**:
  - CPU and RAM usage tracking
  - Storage commitment monitoring
  - Uptime and reliability metrics
  - Pod credits system
  - Intelligent ranking algorithm
- **Interactive Visualizations**: 
  - Global node distribution map
  - Sortable and searchable node table
  - Performance trend tracking
- **Auto-Refresh**: Configurable data synchronization via cron jobs

## 📊 Metrics Tracked

- Total active nodes
- RPC endpoint availability
- Geographic distribution
- CPU and memory utilization
- Storage usage
- Node versions
- Pod credits
- Performance scores

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Data Fetching**: SWR for real-time updates
- **Deployment**: Vercel
- **Maps**: Leaflet with React-Leaflet

## 📦 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see SETUP.md)
cp .env.example .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## 📚 Documentation

- **[SETUP.md](SETUP.md)**: Complete installation and deployment guide
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)**: Database structure and requirements

## 🔧 Configuration

See [SETUP.md](SETUP.md) for detailed configuration instructions including:
- Database setup
- Environment variables
- Cron job configuration
- Deployment to Vercel

## 🎯 Ranking Algorithm

Nodes are ranked using a weighted scoring system:

- **Uptime (40%)**: Rewards nodes with longer continuous operation
- **Credits (30%)**: Higher pod credits increase bonus points
- **Version (20%)**: Nodes running the latest version get bonus points
- **Resources (10%)**: Lower CPU usage indicates better efficiency

## 🌐 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/nodes` | Fetch all nodes with latest stats |
| `GET /api/network-stats` | Get aggregated network statistics |
| `GET /api/cron/update-nodes` | Trigger data synchronization |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT

## 🙏 Acknowledgments

- Xandeum Network for RPC access
- Pod Credits API for credit data
- ip-api.com for geolocation services

---

Built with ❤️ for the Xandeum Network
