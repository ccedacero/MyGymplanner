#!/bin/bash

# Quick test run - checks routes once and exits

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run setup.sh first."
    exit 1
fi

source venv/bin/activate
python amtrak_monitor.py --once
