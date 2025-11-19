#!/bin/bash

# Amtrak Automation Setup Script
# This script sets up the monitoring system

set -e

echo "🚂 Amtrak Automation Setup"
echo "=========================="
echo ""

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✓ Python $PYTHON_VERSION found"

# Create virtual environment
echo ""
echo "Creating Python virtual environment..."
cd monitor
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo ""
echo "Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

# Install Playwright browsers
echo ""
echo "Installing Playwright browser (Chromium)..."
playwright install chromium

# Create config from example
echo ""
if [ ! -f "../config/config.json" ]; then
    echo "Creating config.json from example..."
    cp ../config/config.example.json ../config/config.json
    echo "⚠️  IMPORTANT: Edit config/config.json with your preferences!"
else
    echo "✓ config.json already exists"
fi

# Make monitor script executable
chmod +x amtrak_monitor.py

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit config/config.json with your route preferences"
echo "2. Run the monitor:"
echo "   cd monitor"
echo "   source venv/bin/activate"
echo "   python amtrak_monitor.py"
echo ""
echo "For the form-filler:"
echo "1. Install Tampermonkey browser extension"
echo "2. Open form-filler/amtrak-autofill.user.js"
echo "3. Copy contents and create new Tampermonkey script"
echo ""
