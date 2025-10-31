#!/usr/bin/env bash
set -e

echo "Checking for Docker..."
if ! command -v docker &> /dev/null
then
    echo "Docker not found. Installing uv..."
    
    if ! command -v uv &> /dev/null
    then
        # Replace this with your actual uv installation method
        echo "Downloading uv..."
        curl -sSL https://example.com/uv-latest-linux.tar.gz -o /tmp/uv.tar.gz
        tar -xzf /tmp/uv.tar.gz -C /usr/local/bin
        chmod +x /usr/local/bin/uv
    fi

    echo "Running uv sync..."
    uv sync

    echo "Running main.py via uv..."
    uv run main.py
else
    echo "Docker is installed, you can use Docker instead if needed."
fi

echo "Installation complete!"
