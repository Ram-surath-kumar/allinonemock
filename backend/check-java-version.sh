#!/bin/bash

# Check Java version
echo "Checking Java version..."
JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)

if [ -z "$JAVA_VERSION" ]; then
    echo "❌ Java is not installed or not in PATH"
    exit 1
fi

echo "Current Java version: $(java -version 2>&1 | head -1)"

if [ "$JAVA_VERSION" -ge 21 ]; then
    echo "✅ Java version is compatible (21 or higher)"
    exit 0
else
    echo "❌ Java version $JAVA_VERSION is not compatible. This project requires Java 21 or higher."
    echo ""
    echo "Please install Java 21:"
    echo "  - macOS: brew install openjdk@21"
    echo "  - Ubuntu: sudo apt-get install openjdk-21-jdk"
    echo "  - Or download from: https://adoptium.net/"
    exit 1
fi

