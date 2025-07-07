# Supermachine Deployment Checklist

## Pre-Deployment Steps

### 1. ✅ Environment Setup
```bash
# Remove any existing .env file (contains secrets)
rm -f .env

# Ensure all dependencies are in "dependencies" not "devDependencies"
npm install --save typescript @types/node @types/express @types/mime-types
```

### 2. ✅ MongoDB Atlas Configuration
- [ ] Log into MongoDB Atlas
- [ ] Go to Network Access
- [ ] Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
- [ ] Save changes and wait 2 minutes for propagation

### 3. ✅ Build Verification
```bash
# Clean and rebuild
npm run clean
npm run build

# Verify deployment readiness
node verify-deployment.js
```

### 4. ✅ Repository Preparation
- [ ] Commit all changes
- [ ] Push to GitHub
- [ ] Ensure repository is public or Supermachine has access

## Supermachine Configuration

### 1. ✅ Environment Variables
Set these in Supermachine dashboard:

| Variable | Value |
|----------|-------|
| `GOOGLE_API_KEY` | Your Gemini API key |
| `MONGODB_URI` | `mongodb+srv://joseperko1982:SFfgjMDQX8FMkGwK@joeexexassitant.rhr3hwx.mongodb.net/?retryWrites=true&w=majority&appName=Joeexexassitant` |
| `MONGODB_DB_NAME` | `video_analysis` |
| `TRANSPORT_TYPE` | `stdio` |
| `LOG_LEVEL` | `info` |

### 2. ✅ Build Commands
Supermachine should run:
```
npm install
npm run build
```

### 3. ✅ Start Command
```
npm start
```

## Common Issues & Solutions

### ❌ "Cannot find module" Error
**Solution**: Ensure all imports use `.js` extension:
```typescript
import { Server } from './server.js';  // ✅ Correct
import { Server } from './server';     // ❌ Wrong
```

### ❌ MongoDB Connection Timeout
**Solutions**:
1. Check IP whitelist in MongoDB Atlas (must be `0.0.0.0/0`)
2. Verify connection string format
3. Check if database user has correct permissions

### ❌ TypeScript Build Errors
**Solution**: TypeScript must be in dependencies:
```json
{
  "dependencies": {
    "typescript": "^5.8.3"
  }
}
```

### ❌ Environment Variables Not Found
**Solution**: 
1. Check variable names match exactly (case-sensitive)
2. Ensure no spaces around `=` in Supermachine
3. Restart deployment after changing variables

## Quick Fix Commands

If deployment fails, run these locally and push changes:

```bash
# Fix all dependencies
npm install --save typescript @types/node @types/express @types/mime-types

# Rebuild
npm run clean && npm run build

# Verify
node verify-deployment.js

# Commit and push
git add .
git commit -m "Fix deployment configuration"
git push
```

## Success Indicators

When deployment is successful, you should see:
- ✅ "MongoDB connected successfully"
- ✅ "Server started successfully"
- ✅ No error messages in logs
- ✅ Status shows "Running" in Supermachine

## Need Help?

1. Check deployment logs in Supermachine
2. Run `node verify-deployment.js` locally
3. Review SUPERMACHINE_TROUBLESHOOTING.md
4. Contact Supermachine support with:
   - Deployment ID
   - Error logs
   - This checklist with items marked