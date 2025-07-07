# MCP Video Recognition - Installation Summary

## For Supermachine Installation

### Repository URL
```
https://github.com/yourusername/mcp_video_recognition
```

### Build Commands
```bash
npm install
npm run build
```

### Start Command
```bash
npm start
```

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_DB_NAME` | `video_analysis` | Database name |
| `TRANSPORT_TYPE` | `stdio` | Transport type (stdio or sse) |
| `LOG_LEVEL` | `info` | Logging level |

### Features

- Analyzes images, videos, and audio using Google Gemini AI
- Downloads media from URLs automatically
- Caches results in MongoDB to avoid reprocessing
- Stores media files as binary data in database

### Tools Available

1. **image_recognition** - Analyze images from URLs or file paths
2. **video_recognition** - Analyze videos from URLs or file paths  
3. **audio_recognition** - Analyze audio files (currently file paths only)

### Node.js Requirement
- Version 18.0.0 or higher

### Repository Structure
```
├── src/           # Source code
├── dist/          # Built JavaScript (created after npm run build)
├── package.json   # Dependencies and scripts
├── tsconfig.json  # TypeScript configuration
└── .env.example   # Environment template
```

### Support Documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [SUPERMACHINE_SETUP.md](./SUPERMACHINE_SETUP.md) - Detailed Supermachine instructions
- [README.md](./README.md) - Main documentation