# Supermachine Installation Guide

This guide provides step-by-step instructions for installing the MCP Video Recognition server on Supermachine.

## Transport Support

This MCP server supports **BOTH** transport modes:
✅ **STDIO Transport** (Default)  
✅ **SSE Transport** (Server-Sent Events over HTTP)

## Prerequisites

Before installation, you need:
1. A Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. A MongoDB database (MongoDB Atlas recommended)
3. MongoDB connection string with credentials

## Installation Steps

### 1. Add the MCP to Supermachine

1. Log into your Supermachine dashboard
2. Navigate to "Add MCP Server"
3. Enter the GitHub repository URL:
   ```
   https://github.com/yourusername/mcp_video_recognition
   ```
4. Click "Add Server"

### 2. Configure Environment Variables

In the Supermachine dashboard, add the following environment variables:

#### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Your Google Gemini API key | `AIzaSy...` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |

#### Transport Configuration
| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `TRANSPORT_TYPE` | Transport mode | `stdio` | `stdio` or `sse` |
| `PORT` | Port for SSE mode | `3000` | Any available port |

#### Optional Variables
| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MONGODB_DB_NAME` | Database name | `video_analysis` | `my_video_db` |
| `LOG_LEVEL` | Logging verbosity | `info` | `debug`, `error` |

### 3. Build Configuration

The MCP requires the following build steps:
```bash
npm install
npm run build
```

Supermachine should automatically run these commands during installation.

### 4. Start Commands

#### STDIO Mode (Default)
```bash
npm start
```
or
```bash
npm run start:stdio
```

#### SSE Mode
```bash
npm run start:sse
```
or with environment variables:
```bash
TRANSPORT_TYPE=sse PORT=3000 npm start
```

#### Direct Commands
```bash
# STDIO mode
node dist/index.js

# SSE mode
TRANSPORT_TYPE=sse PORT=3000 node dist/index.js
```

## SSE Mode Configuration

### To run in SSE mode on Supermachine:

1. **Set Transport Environment Variable:**
   ```
   TRANSPORT_TYPE=sse
   PORT=3000
   ```

2. **Use SSE Start Command:**
   ```bash
   npm run start:sse
   ```

3. **Verify SSE is Running:**
   - Check logs for "Server started with SSE transport on port 3000"
   - HTTP endpoints will be available at the configured port

### SSE Benefits
- Network accessible (not just local)
- Supports multiple concurrent clients
- Better debugging with HTTP tools
- Session management included

## Verification

After installation, verify the MCP is running by checking:

### For STDIO Mode:
1. Server status in Supermachine dashboard shows "Running"
2. Logs show "Server started with stdio transport"
3. Logs show "MongoDB connected successfully"

### For SSE Mode:
1. Server status shows "Running" 
2. Logs show "Server started with SSE transport on port 3000"
3. Logs show "MongoDB connected successfully"
4. HTTP endpoint responds: `curl http://localhost:3000/mcp`

## Available Tools

Once installed, the following tools are available:

- `image_recognition` - Analyze images from URLs or file paths
- `video_recognition` - Analyze videos from URLs or file paths
- `audio_recognition` - Analyze audio files (file paths only currently)

## Troubleshooting

### MongoDB Connection Failed
- Verify your connection string is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure the database user has read/write permissions

### Google API Key Invalid
- Verify the API key is active in Google AI Studio
- Check if Gemini API is enabled for your project

### Build Failures
- Ensure Node.js 18+ is available
- Check if all dependencies installed correctly
- Review build logs for specific errors

## Support

For issues specific to:
- This MCP: Create an issue on the GitHub repository
- Supermachine: Contact Supermachine support
- MongoDB: Refer to MongoDB documentation
- Google Gemini: Check Google AI Studio documentation