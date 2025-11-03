#!/bin/bash
# Stop all grading workflow services

echo "🛑 Stopping Grading Workflow Services..."
echo ""

if [ -f ".service-pids" ]; then
    source .service-pids

    echo "Stopping Dashboard (PID: $DASHBOARD_PID)..."
    kill $DASHBOARD_PID 2>/dev/null && echo "   ✓ Dashboard stopped" || echo "   ⚠ Dashboard not running"

    echo "Stopping File Watcher (PID: $WATCHER_PID)..."
    kill $WATCHER_PID 2>/dev/null && echo "   ✓ File Watcher stopped" || echo "   ⚠ File Watcher not running"

    echo "Stopping Worker (PID: $WORKER_PID)..."
    kill $WORKER_PID 2>/dev/null && echo "   ✓ Worker stopped" || echo "   ⚠ Worker not running"

    echo "Stopping Temporal Server (PID: $TEMPORAL_PID)..."
    kill $TEMPORAL_PID 2>/dev/null && echo "   ✓ Temporal Server stopped" || echo "   ⚠ Temporal Server not running"

    rm .service-pids
    echo ""
    echo "✅ All services stopped"
else
    echo "⚠ No .service-pids file found. Searching for processes..."

    # Kill by process name as fallback
    pkill -f "temporal server start-dev" && echo "   ✓ Temporal Server stopped"
    pkill -f "ts-node src/worker" && echo "   ✓ Worker stopped"
    pkill -f "ts-node src/file-watcher" && echo "   ✓ File Watcher stopped"
    pkill -f "ts-node src/dashboard" && echo "   ✓ Dashboard stopped"

    echo ""
    echo "✅ Stopped all matching processes"
fi
