# SSE (Server-Sent Events) Configuration Guide

This MCP server supports **both STDIO and SSE transport modes**. This guide provides detailed instructions for running in SSE mode.

## Transport Support

✅ **STDIO Transport** (Default)  
✅ **SSE Transport** (Server-Sent Events over HTTP)

## SSE Mode Configuration

### 1. Environment Variables for SSE

Create `.env` file with:
```env
# Required
GOOGLE_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string

# SSE-specific configuration
TRANSPORT_TYPE=sse
PORT=3000

# Optional
MONGODB_DB_NAME=video_analysis
LOG_LEVEL=info
```

### 2. Starting in SSE Mode

#### Option A: Using npm script
```bash
npm run start:sse
```

#### Option B: Using environment variables
```bash
TRANSPORT_TYPE=sse PORT=3000 npm start
```

#### Option C: Direct command
```bash
TRANSPORT_TYPE=sse PORT=3000 node dist/index.js
```

### 3. SSE Development Mode
```bash
npm run dev:sse
```

## Supermachine SSE Configuration

### For Supermachine Deployment

1. **Set Environment Variables:**
   ```
   TRANSPORT_TYPE=sse
   PORT=3000
   GOOGLE_API_KEY=your_api_key
   MONGODB_URI=your_mongodb_uri
   ```

2. **Use SSE Start Command:**
   ```bash
   npm run start:sse
   ```

3. **Or Direct Command:**
   ```bash
   TRANSPORT_TYPE=sse PORT=3000 node dist/index.js
   ```

## SSE Transport Details

### HTTP Endpoints

When running in SSE mode, the server exposes:

- `GET /mcp` - Establishes SSE connection for server-to-client notifications
- `POST /mcp` - Handles client-to-server requests
- `DELETE /mcp` - Terminates sessions

### Session Management

- Each SSE connection gets a unique session ID
- Sessions are automatically managed and cleaned up
- Multiple concurrent sessions supported

### Connection Headers

The SSE transport uses these headers:
- `mcp-session-id` - Session identifier
- `Content-Type: application/json` - For POST requests
- `text/event-stream` - For SSE responses

## Testing SSE Connection

### 1. Health Check
```bash
curl http://localhost:3000/mcp \
  -H "Accept: text/event-stream"
```

### 2. Using MCP Inspector
```bash
npm run debug
```

### 3. Manual Testing
```javascript
// Browser test
const eventSource = new EventSource('http://localhost:3000/mcp');
eventSource.onmessage = (event) => {
  console.log('Received:', event.data);
};
```

## Troubleshooting SSE

### Common Issues

1. **Port Already in Use**
   ```bash
   Error: listen EADDRINUSE :::3000
   ```
   Solution: Change port in environment variables
   ```bash
   PORT=3001 npm run start:sse
   ```

2. **SSE Connection Fails**
   - Check firewall settings
   - Verify port is accessible
   - Ensure TRANSPORT_TYPE=sse is set

3. **Session Management Issues**
   - Check for missing `mcp-session-id` header
   - Verify session cleanup on disconnect

### Debug Logging
```bash
LOG_LEVEL=debug TRANSPORT_TYPE=sse npm start
```

## SSE vs STDIO Comparison

| Feature | STDIO | SSE |
|---------|-------|-----|
| Transport | Pipe-based | HTTP-based |
| Networking | Local only | Network accessible |
| Multiple clients | No | Yes |
| Session management | Simple | Advanced |
| Debugging | Basic | Rich (browser tools) |
| Firewall friendly | Yes | Requires open port |

## Production SSE Deployment

### Security Considerations
- Use HTTPS in production
- Implement authentication if needed
- Configure proper CORS headers
- Set up reverse proxy (nginx/apache)

### Load Balancing
SSE sessions are stateful - use sticky sessions or session sharing for load balancing.

### Monitoring
Monitor these metrics:
- Active SSE connections
- Session creation/cleanup rates
- HTTP error rates
- Memory usage

## Package.json SSE Indicators

The MCP configuration in package.json explicitly declares SSE support:

```json
{
  "mcp": {
    "transports": ["stdio", "sse"],
    "defaultTransport": "stdio",
    "ssePort": 3000,
    "tools": [
      "image_recognition",
      "video_recognition", 
      "audio_recognition"
    ]
  }
}
```

This metadata helps tools like Supermachine automatically detect SSE capability.