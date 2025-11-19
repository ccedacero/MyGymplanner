#!/bin/bash

# Start continuous monitoring

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run setup.sh first."
    exit 1
fi

source venv/bin/activate

echo "🚂 Starting Amtrak monitor..."
echo "Press Ctrl+C to stop"
echo ""

python amtrak_monitor.py
