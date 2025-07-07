# Supermachine Installation Guide

This guide provides step-by-step instructions for installing the MCP Video Recognition server on Supermachine.

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

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GOOGLE_API_KEY` | Yes | Your Google Gemini API key | `AIzaSy...` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGODB_DB_NAME` | No | Database name (default: video_analysis) | `my_video_db` |
| `TRANSPORT_TYPE` | No | Transport type (default: stdio) | `stdio` or `sse` |
| `LOG_LEVEL` | No | Logging level (default: info) | `info`, `debug`, `error` |

### 3. Build Configuration

The MCP will automatically build during installation:
- `npm install` triggers the `postinstall` script
- The `postinstall` script runs `npm run build`
- This compiles TypeScript to JavaScript in the `dist` folder

**Note**: The build happens automatically - no manual build step needed!

### 4. Start Command

The server starts with:
```bash
npm start
```

Or directly:
```bash
node dist/index.js
```

## Verification

After installation, verify the MCP is running by checking:
1. Server status in Supermachine dashboard shows "Running"
2. Logs show "MongoDB connected successfully"
3. Logs show "Server started successfully"

## Available Tools

Once installed, the following tools are available:

- `image_recognition` - Analyze images from URLs or file paths
- `video_recognition` - Analyze videos from URLs or file paths
- `audio_recognition` - Analyze audio files (file paths only currently)

## Troubleshooting

### "Cannot find module" or "dist/index.js not found"
- This means the TypeScript build didn't complete
- Ensure the repository has the latest `package.json` with `postinstall` script
- Try manually running the build command in Supermachine console if available
- Verify Node.js 18+ is being used

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
- TypeScript is now in dependencies (not devDependencies) for production builds

## Support

For issues specific to:
- This MCP: Create an issue on the GitHub repository
- Supermachine: Contact Supermachine support
- MongoDB: Refer to MongoDB documentation
- Google Gemini: Check Google AI Studio documentation