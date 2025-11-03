# Starting the Grading Workflow

After restarting your computer, you need to start 4 components in order:

## Quick Start (Recommended)

Run this single command in the project directory:

```bash
npm run start-all
```

This will start all services in the background.

## Manual Start (Step by Step)

If you prefer to start services manually:

### 1. Start Temporal Server
```bash
temporal server start-dev
```
Leave this terminal open. Open a new terminal for the next steps.

### 2. Start the Temporal Worker
```bash
cd temporal-grading-worker
npm start
```
Leave this terminal open. Open a new terminal for the next step.

### 3. Start the File Watcher
```bash
cd temporal-grading-worker
npm run watch
```
This monitors your Google Drive folder for new submissions.
Leave this terminal open. Open a new terminal for the next step.

### 4. Start the Dashboard (Optional)
```bash
cd temporal-grading-worker
npm run dashboard
```
Then open http://localhost:3001 in your browser.

## What Each Component Does

- **Temporal Server** (localhost:7233) - Workflow orchestration engine
- **Worker** - Executes grading activities (fetch, grade, save)
- **File Watcher** - Monitors Google Drive folder every 60 seconds
- **Dashboard** - Web UI to view results and configure settings

## Checking if Services are Running

```bash
# Check if Temporal server is running
curl http://localhost:7233 2>/dev/null && echo "Temporal is running" || echo "Temporal is not running"

# Check if Dashboard is running
curl http://localhost:3001 2>/dev/null && echo "Dashboard is running" || echo "Dashboard is not running"
```

## Stopping Services

Press `Ctrl+C` in each terminal window to stop the services.

Or if running in background:
```bash
npm run stop-all
```

## Troubleshooting

**Problem**: "Port already in use"
**Solution**: Another instance is already running. Find and kill it:
```bash
# Windows (Git Bash)
netstat -ano | grep :7233
taskkill /PID <pid> /F
```

**Problem**: "GOOGLE_DRIVE_FOLDER_ID not set"
**Solution**: Check your `.env` file has all required variables set.

**Problem**: "File watcher not detecting files"
**Solution**:
1. Check the folder ID in Settings (dashboard)
2. Ensure service account has access to the folder
3. Wait 60 seconds (default polling interval)
