# MCP Video Recognition - Deployment Guide

## Overview

This MCP server provides AI-powered media recognition using Google Gemini with MongoDB storage for caching and persistence.

## Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Google Gemini API key
- MongoDB database access

### 2. Clone & Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/mcp_video_recognition.git
cd mcp_video_recognition

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Required: GOOGLE_API_KEY and MONGODB_URI
```

### 3. Build & Run
```bash
# Build the TypeScript code
npm run build

# Start the server
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | ✅ | Google Gemini API key |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `MONGODB_DB_NAME` | ❌ | Database name (default: `video_analysis`) |
| `TRANSPORT_TYPE` | ❌ | `stdio` or `sse` (default: `stdio`) |
| `LOG_LEVEL` | ❌ | Log verbosity (default: `info`) |

## Deployment Options

### Option 1: Supermachine (Recommended)
See [SUPERMACHINE_SETUP.md](./SUPERMACHINE_SETUP.md) for detailed instructions.

### Option 2: Manual MCP Client Integration

Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "video-recognition": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "GOOGLE_API_KEY": "your-key",
        "MONGODB_URI": "your-mongodb-uri"
      }
    }
  }
}
```

### Option 3: Docker (Coming Soon)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
CMD ["npm", "start"]
```

## MongoDB Setup

### MongoDB Atlas (Recommended)
1. Create free cluster at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Add database user with read/write permissions
3. Whitelist your IP address
4. Copy connection string

### Local MongoDB
```bash
# Install MongoDB locally
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Use local connection string
MONGODB_URI=mongodb://localhost:27017/video_analysis
```

## Available Tools

### 1. Image Recognition
```json
{
  "name": "image_recognition",
  "arguments": {
    "url": "https://example.com/image.jpg",
    "prompt": "Describe this image",
    "saveToDb": true
  }
}
```

### 2. Video Recognition
```json
{
  "name": "video_recognition",
  "arguments": {
    "url": "https://example.com/video.mp4",
    "prompt": "What happens in this video?",
    "saveToDb": true
  }
}
```

### 3. Audio Recognition
```json
{
  "name": "audio_recognition",
  "arguments": {
    "filepath": "/path/to/audio.mp3",
    "prompt": "Transcribe this audio",
    "saveToDb": true
  }
}
```

## Features

- **URL Support**: Download and analyze media from URLs
- **Caching**: Automatic result caching in MongoDB
- **Binary Storage**: Media files stored in database
- **Multiple Formats**: Support for common image/video formats

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check connection string format
   - Verify network access (IP whitelist)
   - Ensure user has correct permissions

2. **Google API Errors**
   - Verify API key is active
   - Check quota limits
   - Ensure Gemini API is enabled

3. **Build Errors**
   - Run `npm run clean` then `npm run build`
   - Check Node.js version (18+)
   - Delete `node_modules` and reinstall

### Debug Mode
```bash
# Run with verbose logging
LOG_LEVEL=debug npm start

# Use MCP inspector
npm run debug
```

## Performance Tips

1. **MongoDB Indexes**: Automatically created on first run
2. **File Size Limits**: Default 100MB per file
3. **Caching**: URLs are cached to avoid re-processing

## Security Best Practices

1. Never commit `.env` files
2. Use environment variables for secrets
3. Implement IP whitelisting in MongoDB
4. Rotate API keys regularly
5. Use read-only database users when possible

## Support

- **Issues**: GitHub repository issues
- **MongoDB**: [MongoDB Documentation](https://docs.mongodb.com/)
- **Google Gemini**: [Google AI Studio](https://makersuite.google.com/)
- **MCP Protocol**: [MCP Documentation](https://modelcontextprotocol.io/)