#!/bin/bash

# Start script for sol-safekey-ui

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/sol-safekey-ui.pid"
PORT=3001

# Function to stop the server
stop_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "🛑 Stopping server (PID: $PID)..."
            kill "$PID" 2>/dev/null || true
            # Wait for process to terminate
            for i in {1..10}; do
                if ! kill -0 "$PID" 2>/dev/null; then
                    break
                fi
                sleep 0.5
            done
            # Force kill if still running
            if kill -0 "$PID" 2>/dev/null; then
                echo "⚠️  Force killing server..."
                kill -9 "$PID" 2>/dev/null || true
            fi
            echo "✅ Server stopped"
        else
            echo "ℹ️  Server process not running (stale PID file)"
        fi
        rm -f "$PID_FILE"
    fi
}

# Function to check and kill process using the port
kill_port_process() {
    if lsof -i :$PORT > /dev/null 2>&1; then
        echo "⚠️  Port $PORT is in use. Killing existing process..."
        lsof -t -i :$PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Handle command line arguments
case "${1:-start}" in
    start)
        echo "🚀 Starting Sol SafeKey UI..."
        
        # Check if the binary exists
        if [ ! -f "./target/release/sol-safekey-ui" ]; then
            echo "⚠️  Binary not found. Building first..."
            cargo build --release
        fi
        
        # Stop existing server and kill port process
        stop_server
        kill_port_process
        
        # Start the server
        echo "✅ Starting server at http://localhost:$PORT"
        echo "📱 Open your browser and navigate to http://localhost:$PORT"
        echo "📁 PID file: $PID_FILE"
        echo ""
        echo "Press Ctrl+C to stop the server"
        echo ""
        
        # Trap Ctrl+C to clean up PID file
        trap 'rm -f "$PID_FILE"; echo ""; echo "🛑 Server stopped"; exit 0' SIGINT SIGTERM
        
        # Start server and save PID
        ./target/release/sol-safekey-ui &
        SERVER_PID=$!
        echo $SERVER_PID > "$PID_FILE"
        
        # Wait for server process
        wait $SERVER_PID
        ;;
    
    stop)
        echo "🛑 Stopping Sol SafeKey UI..."
        stop_server
        kill_port_process
        ;;
    
    restart)
        echo "🔄 Restarting Sol SafeKey UI..."
        stop_server
        kill_port_process
        sleep 1
        exec "$0" start
        ;;
    
    status)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if kill -0 "$PID" 2>/dev/null; then
                echo "✅ Server is running (PID: $PID)"
                echo "📱 http://localhost:$PORT"
            else
                echo "❌ Server is not running (stale PID file)"
                rm -f "$PID_FILE"
            fi
        else
            if lsof -i :$PORT > /dev/null 2>&1; then
                echo "⚠️  Port $PORT is in use by another process"
                lsof -i :$PORT
            else
                echo "❌ Server is not running"
            fi
        fi
        ;;
    
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the server (default)"
        echo "  stop    - Stop the server"
        echo "  restart - Restart the server"
        echo "  status  - Check server status"
        exit 1
        ;;
esac
