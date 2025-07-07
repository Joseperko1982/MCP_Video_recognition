# Supermachine Deployment Troubleshooting Guide

## Common Deployment Issues and Solutions

### 1. Build Failures

#### Issue: TypeScript compilation errors
**Solution:**
```bash
# Ensure TypeScript is in dependencies, not just devDependencies
npm install --save typescript
```

Update `package.json`:
```json
{
  "dependencies": {
    "typescript": "^5.8.3"
  }
}
```

#### Issue: Missing type definitions
**Solution:**
Add all type definitions to regular dependencies:
```bash
npm install --save @types/node @types/express @types/mime-types
```

### 2. Environment Variable Issues

#### Issue: Environment variables not being read
**Solution:**
Ensure `dotenv` is imported at the very beginning of `index.ts`:
```typescript
import 'dotenv/config';  // Must be first line
```

#### Issue: Required environment variables missing
**Solution:**
In Supermachine dashboard, ensure these are set:
- `GOOGLE_API_KEY` - Your Gemini API key
- `MONGODB_URI` - Full MongoDB connection string
- `NODE_ENV` - Set to `production`

### 3. MongoDB Connection Issues

#### Issue: MongoDB connection timeout
**Solutions:**

1. **IP Whitelist**: In MongoDB Atlas, add Supermachine's IP addresses:
   - Add `0.0.0.0/0` to allow all IPs (less secure but works)
   - Or contact Supermachine for their specific IP ranges

2. **Connection String Format**: Ensure your MongoDB URI includes all parameters:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=YourApp
   ```

3. **Add connection retry logic** in `mongodb.ts`:
   ```typescript
   async connect(): Promise<void> {
     const maxRetries = 3;
     let retries = 0;
     
     while (retries < maxRetries) {
       try {
         await this.client.connect();
         break;
       } catch (error) {
         retries++;
         if (retries === maxRetries) throw error;
         await new Promise(resolve => setTimeout(resolve, 5000));
       }
     }
   }
   ```

### 4. Module Resolution Issues

#### Issue: ES Module errors
**Solution:**
Ensure `package.json` has:
```json
{
  "type": "module"
}
```

And `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "target": "ES2020"
  }
}
```

### 5. Port Configuration Issues

#### Issue: Server not accessible
**Solution:**
For SSE transport, ensure the port is from environment:
```typescript
const port = process.env.PORT || 3000;
```

### 6. Build Script Issues

#### Issue: Build fails on Supermachine
**Solution:**
Update `package.json` scripts:
```json
{
  "scripts": {
    "clean": "rm -rf dist || true",
    "prebuild": "npm run clean",
    "build": "tsc --build",
    "postbuild": "echo 'Build completed successfully'",
    "start": "node dist/index.js"
  }
}
```

### 7. Dependency Issues

#### Issue: Missing dependencies at runtime
**Solution:**
Move ALL required packages to `dependencies` (not `devDependencies`):
```bash
npm install --save express dotenv mongodb axios mime-types zod
npm install --save @google/genai @modelcontextprotocol/sdk
```

### 8. File Path Issues

#### Issue: Cannot find modules
**Solution:**
Use explicit `.js` extensions in imports:
```typescript
import { Server } from './server.js';
import { createLogger } from './utils/logger.js';
```

## Quick Fix Script

Create `fix-deployment.sh`:
```bash
#!/bin/bash

# Move all dependencies to production
npm install --save typescript @types/node @types/express @types/mime-types

# Rebuild
npm run clean
npm run build

# Test locally
GOOGLE_API_KEY=test MONGODB_URI=test npm start --dry-run
```

## Verification Checklist

Before deploying, verify:
- [ ] All imports use `.js` extensions
- [ ] `dotenv/config` is imported first in `index.ts`
- [ ] All dependencies are in `dependencies`, not `devDependencies`
- [ ] MongoDB Atlas allows connections from all IPs
- [ ] Environment variables are set in Supermachine
- [ ] Build runs successfully locally
- [ ] `dist` folder is created after build

## Contact Support

If issues persist:
1. Check Supermachine logs for specific errors
2. Contact Supermachine support with:
   - Your deployment ID
   - Complete error logs
   - Your `package.json` file

## Common Error Messages

### "Cannot find module"
- Check import paths use `.js` extensions
- Ensure TypeScript is building correctly

### "ECONNREFUSED" or "MongoNetworkError"
- Check MongoDB Atlas IP whitelist
- Verify connection string format

### "Missing required environment variable"
- Check Supermachine environment settings
- Ensure variable names match exactly