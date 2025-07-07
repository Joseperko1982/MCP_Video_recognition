# MCP Video Recognition Server

An MCP (Model Context Protocol) server that provides AI-powered media recognition using Google's Gemini AI. Enhanced with MongoDB integration for storing media files and analysis results, plus support for downloading media from URLs.

<a href="https://glama.ai/mcp/servers/@mario-andreschak/mcp_video_recognition">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@mario-andreschak/mcp_video_recognition/badge" alt="Video Recognition Server MCP server" />
</a>

## 🚀 Features

- **Image Recognition**: Analyze and describe images using Google Gemini AI
- **Audio Recognition**: Analyze and transcribe audio using Google Gemini AI  
- **Video Recognition**: Analyze and describe videos using Google Gemini AI
- **URL Support**: Download and analyze media directly from URLs
- **MongoDB Integration**: Store downloaded media and analysis results
- **Automatic Caching**: Skip redundant processing with intelligent caching
- **Dual Transport Support**: Both STDIO and SSE (Server-Sent Events) modes
- **Network Accessible**: SSE mode enables HTTP-based remote access

## 📋 Prerequisites

- Node.js 18 or higher
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- MongoDB database (MongoDB Atlas or self-hosted)

## 🛠️ Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp_video_recognition.git
cd mcp_video_recognition

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Build and start
npm run build
npm start
```

## 🌐 Transport Modes

This MCP supports **both** transport modes:

### STDIO Transport (Default)
```bash
npm start
# or
npm run start:stdio
```

### SSE Transport (HTTP-based)
```bash
npm run start:sse
# or
TRANSPORT_TYPE=sse PORT=3000 npm start
```

## 📚 Documentation

- [SSE Configuration Guide](./SSE_CONFIGURATION.md) - Detailed SSE setup
- [Deployment Guide](./DEPLOYMENT.md) - Detailed deployment instructions
- [Supermachine Setup](./SUPERMACHINE_SETUP.md) - Supermachine-specific installation
- [MongoDB Examples](./examples/mongodb-examples.md) - Database query examples

## 🔧 Configuration

Create a `.env` file with:
```env
GOOGLE_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
```

See [.env.example](./.env.example) for all options.

## 🎯 Usage

### Image Recognition
```json
{
  "name": "image_recognition",
  "arguments": {
    "url": "https://example.com/image.jpg",
    "prompt": "Describe this image"
  }
}
```

### Video Recognition
```json
{
  "name": "video_recognition",
  "arguments": {
    "url": "https://example.com/video.mp4",
    "prompt": "What happens in this video?"
  }
}
```

### Tool Parameters

- `filepath` or `url` (required): Local file path OR URL to media
- `prompt` (optional): Custom analysis prompt
- `modelname` (optional): Gemini model (default: "gemini-2.0-flash")
- `saveToDb` (optional): Save to MongoDB (default: true)

## 🗄️ MongoDB Features

- **Automatic Caching**: Reuse previous analysis results
- **Binary Storage**: Store media files in database
- **Metadata Tracking**: Save prompts, models, and timestamps
- **Search Capability**: Full-text search on analysis results

## 📁 Project Structure

```
src/
├── index.ts        # Entry point
├── server.ts       # MCP server implementation
├── tools/          # Recognition tools
├── services/       # Core services
│   ├── gemini.ts   # Gemini AI integration
│   ├── mongodb.ts  # Database operations
│   └── media-downloader.ts # URL downloads
├── types/          # TypeScript definitions
└── utils/          # Utilities
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/mcp_video_recognition/issues)
- **Documentation**: See documentation files in this repository
- **MCP Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io/)