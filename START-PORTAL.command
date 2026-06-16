#!/bin/bash
echo "========================================"
echo "  CompVerify Portal - Starting..."
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo ""
    echo "Please go to https://nodejs.org and install the LTS version."
    echo "Then double-click this file again."
    read -p "Press Enter to exit..."
    exit 1
fi

# Install if needed
if [ ! -d "node_modules" ]; then
    echo "Installing packages for first time... please wait..."
    npm install
fi

# Setup DB if needed
if [ ! -f "data/compverify.db" ]; then
    echo "Setting up database..."
    node src/db/setup.js
fi

# Open browser
echo "Opening portal in your browser..."
sleep 2
open http://localhost:3000

echo ""
echo "Portal running at http://localhost:3000"
echo "Login: admin@yourcompany.com / Admin1234!"
echo ""
echo "DO NOT close this window while using the portal."
echo "Press Ctrl+C to stop."
echo ""
node src/server.js
