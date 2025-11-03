#!/bin/bash
# Start all grading workflow services

echo "🚀 Starting Grading Workflow Services..."
echo ""

# Check if temporal is installed
if ! command -v temporal &> /dev/null; then
    echo "❌ Temporal CLI not found. Please install it first:"
    echo "   https://docs.temporal.io/cli#install"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the temporal-grading-worker directory"
    exit 1
fi

# Create a log directory
mkdir -p logs

echo "1️⃣  Starting Temporal Server..."
temporal server start-dev > logs/temporal-server.log 2>&1 &
TEMPORAL_PID=$!
echo "   ✓ Temporal Server started (PID: $TEMPORAL_PID)"
sleep 3

echo "2️⃣  Starting Temporal Worker..."
npm start > logs/worker.log 2>&1 &
WORKER_PID=$!
echo "   ✓ Worker started (PID: $WORKER_PID)"
sleep 2

echo "3️⃣  Starting File Watcher..."
npm run watch > logs/file-watcher.log 2>&1 &
WATCHER_PID=$!
echo "   ✓ File Watcher started (PID: $WATCHER_PID)"
sleep 2

echo "4️⃣  Starting Dashboard..."
npm run dashboard > logs/dashboard.log 2>&1 &
DASHBOARD_PID=$!
echo "   ✓ Dashboard started (PID: $DASHBOARD_PID)"
sleep 2

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📊 Dashboard: http://localhost:3001"
echo "🔧 Temporal UI: http://localhost:8233"
echo ""
echo "📝 Process IDs saved to: .service-pids"
echo "   Temporal Server: $TEMPORAL_PID"
echo "   Worker: $WORKER_PID"
echo "   File Watcher: $WATCHER_PID"
echo "   Dashboard: $DASHBOARD_PID"
echo ""
echo "📋 Logs are being written to the logs/ directory"
echo ""
echo "To stop all services, run: npm run stop-all"

# Save PIDs for later
cat > .service-pids << EOF
TEMPORAL_PID=$TEMPORAL_PID
WORKER_PID=$WORKER_PID
WATCHER_PID=$WATCHER_PID
DASHBOARD_PID=$DASHBOARD_PID
EOF

echo ""
echo "Press Ctrl+C to stop monitoring logs (services will continue running)"
echo "Tailing combined logs..."
tail -f logs/*.log
