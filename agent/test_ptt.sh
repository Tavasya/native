#!/bin/bash

# Test script for push-to-talk functionality
# This script helps you run both the agent and test client

echo "=== Push-to-Talk Test Setup ==="
echo ""

echo "1. First, make sure your agent is running:"
echo "   python minimal_agent.py dev"
echo ""

echo "2. Then in another terminal, run the test client:"
echo "   python test_client.py"
echo ""

echo "3. In the test client, use these commands:"
echo "   - Type 'start' to begin recording"
echo "   - Speak your message"
echo "   - Type 'end' to stop recording and send to agent"
echo "   - Type 'cancel' to cancel current recording"
echo "   - Type 'quit' to exit"
echo ""

echo "=== Instructions ==="
echo "The agent will only respond to audio when:"
echo "1. You call 'start' in the test client"
echo "2. You speak your message"
echo "3. You call 'end' to commit the turn"
echo ""

echo "If you want to test this now, choose an option:"
echo "1) Run agent only"
echo "2) Run test client only"
echo "3) Show this help again"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "Starting agent..."
        python minimal_agent.py dev
        ;;
    2)
        echo "Starting test client..."
        python test_client.py
        ;;
    3)
        echo "Run this script again to see the instructions"
        ;;
    *)
        echo "Invalid choice. Run the script again."
        ;;
esac