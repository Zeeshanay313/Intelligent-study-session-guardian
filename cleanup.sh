#!/bin/bash
# Simple cleanup script to free up space

echo "🧹 Cleaning up project files..."

# Remove node_modules if they exist (can be reinstalled)
if [ -d "backend/node_modules" ]; then
    echo "Removing backend/node_modules..."
    rm -rf backend/node_modules
fi

if [ -d "frontend/node_modules" ]; then
    echo "Removing frontend/node_modules..."
    rm -rf frontend/node_modules  
fi

# Remove build directories
if [ -d "frontend/build" ]; then
    echo "Removing frontend/build..."
    rm -rf frontend/build
fi

# Remove package-lock files (can be regenerated)
if [ -f "backend/package-lock.json" ]; then
    echo "Removing backend/package-lock.json..."
    rm backend/package-lock.json
fi

if [ -f "frontend/package-lock.json" ]; then
    echo "Removing frontend/package-lock.json..."
    rm frontend/package-lock.json
fi

echo "✅ Cleanup completed!"
echo "📝 To restore dependencies, run:"
echo "   cd backend && npm install"
echo "   cd frontend && npm install"